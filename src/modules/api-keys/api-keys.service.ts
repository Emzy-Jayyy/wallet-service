import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { User } from '../../entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async createApiKey(
    user: User,
    name: string,
    permissions: string[],
    expiry: string,
  ): Promise<{ api_key: string; expires_at: Date }> {
    // Validate permissions
    const validPermissions = ['deposit', 'transfer', 'read'];
    const invalidPerms = permissions.filter(
      (p) => !validPermissions.includes(p),
    );

    if (invalidPerms.length > 0) {
      throw new BadRequestException(
        `Invalid permissions: ${invalidPerms.join(', ')}. Valid: ${validPermissions.join(', ')}`,
      );
    }

    // Check active API keys limit (max 5)
    const activeCount = await this.apiKeyRepository.count({
      where: {
        userId: user.id,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (activeCount >= 5) {
      throw new ForbiddenException('Maximum of 5 active API keys allowed');
    }

    // Actually, we need to check if NOT expired
    // const activeKeys = await this.apiKeyRepository.find({
    //   where: {
    //     userId: user.id,
    //     isRevoked: false,
    //   },
    // });

    // const currentlyActive = activeKeys.filter(
    //   (key) => new Date(key.expiresAt) > new Date(),
    // );

    // if (currentlyActive.length >= 5) {
    //   throw new ForbiddenException(
    //     'Maximum of 5 active API keys allowed. Please revoke an existing key or wait for one to expire.',
    //   );
    // }

    // Convert expiry to datetime
    const expiresAt = this.convertExpiryToDate(expiry);

    // Generate secure API key
    const rawKey = this.generateApiKey();
    const hashedKey = this.hashKey(rawKey);

    // Create and save API key
    const apiKey = this.apiKeyRepository.create({
      key: hashedKey,
      name,
      permissions,
      expiresAt,
      user,
      userId: user.id,
    });

    await this.apiKeyRepository.save(apiKey);

    return {
      api_key: rawKey,
      expires_at: expiresAt,
    };
  }

  async rolloverApiKey(
    user: User,
    expiredKeyId: string,
    newExpiry: string,
  ): Promise<{ api_key: string; expires_at: Date }> {
    // Find the expired key
    const expiredKey = await this.apiKeyRepository.findOne({
      where: {
        id: expiredKeyId,
        userId: user.id,
      },
    });

    if (!expiredKey) {
      throw new NotFoundException('API key not found');
    }

    // Verify the key is actually expired
    if (new Date(expiredKey.expiresAt) > new Date()) {
      throw new BadRequestException('API key must be expired to rollover');
    }

    // ✅ revoke old key
    expiredKey.isRevoked = true;
    await this.apiKeyRepository.save(expiredKey);

    // ✅ check active limit again (safe under concurrency)
    const activeCount = await this.apiKeyRepository.count({
      where: {
        userId: user.id,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (activeCount >= 5) {
      throw new ForbiddenException('Maximum of 5 active API keys allowed');
    }

    // Check active keys limit before creating new one
    // const activeKeys = await this.apiKeyRepository.find({
    //   where: {
    //     userId: user.id,
    //     isRevoked: false,
    //   },
    // });

    // const currentlyActive = activeKeys.filter(
    //   (key) => new Date(key.expiresAt) > new Date(),
    // );

    // if (currentlyActive.length >= 5) {
    //   throw new ForbiddenException(
    //     'Maximum of 5 active API keys allowed. Please revoke an existing key first.',
    //   );
    // }

    // Create new key with same permissions
    const newExpiresAt = this.convertExpiryToDate(newExpiry);
    const rawKey = this.generateApiKey();
    const hashedKey = this.hashKey(rawKey);

    const newApiKey = this.apiKeyRepository.create({
      key: hashedKey,
      name: expiredKey.name,
      permissions: expiredKey.permissions,
      expiresAt: newExpiresAt,
      user,
      userId: user.id,
    });

    await this.apiKeyRepository.save(newApiKey);

    return {
      api_key: rawKey,
      expires_at: newExpiresAt,
    };
  }

  async revokeApiKey(user: User, keyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: {
        id: keyId,
        userId: user.id,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    apiKey.isRevoked = true;
    await this.apiKeyRepository.save(apiKey);
  }

  async validateApiKey(rawKey: string): Promise<ApiKey | null> {
    const hashedKey = this.hashKey(rawKey);

    const apiKey = await this.apiKeyRepository.findOne({
      where: { key: hashedKey },
      relations: ['user', 'user.wallet'],
    });

    if (!apiKey) return null;

    if (apiKey.isRevoked) {
      throw new ForbiddenException('API key has been revoked');
    }

    if (apiKey.expiresAt < new Date()) {
      throw new ForbiddenException('API key has expired');
    }

    return apiKey;
  }

  async getUserApiKeys(user: User): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'name',
        'permissions',
        'expiresAt',
        'isRevoked',
        'createdAt',
      ],
    });
  }

  hasPermission(apiKey: ApiKey, requiredPermission: string): boolean {
    return apiKey.permissions.includes(requiredPermission);
  }

  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private generateApiKey(): string {
    // Generate a secure random API key with prefix
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `sk_live_${randomBytes}`;
  }

  private convertExpiryToDate(expiry: string): Date {
    const validFormats = ['1H', '1D', '1M', '1Y'];

    if (!validFormats.includes(expiry)) {
      throw new BadRequestException(
        `Invalid expiry format. Valid formats: ${validFormats.join(', ')}`,
      );
    }

    const now = new Date();

    switch (expiry) {
      case '1H': {
        return new Date(now.getTime() + 60 * 60 * 1000);
      }

      case '1D': {
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }

      case '1M': {
        const d = new Date(now); // clone
        d.setMonth(d.getMonth() + 1);
        return d;
      }

      case '1Y': {
        const d = new Date(now); // clone
        d.setFullYear(d.getFullYear() + 1);
        return d;
      }

      default:
        throw new BadRequestException('Invalid expiry format');
    }
  }
}
