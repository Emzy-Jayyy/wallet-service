import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { Request } from 'express';
import { JwtPayload } from 'src/utils/types/auth-user.type';
import { ApiKey } from 'src/entities/api-key.entity';

type AuthenticatedRequest = Request & {
  user?: User;
  apiKey?: Partial<ApiKey>;
  authType?: 'api-key' | 'jwt';
};

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly apiKeysService: ApiKeysService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // API key
    const apiKeyHeader = request.headers['x-api-key'];
    const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;

    if (apiKey) {
      return this.validateApiKey(request, apiKey);
    }

    // JWT
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return this.validateJwt(request, authHeader);
    }

    throw new UnauthorizedException('No valid authentication provided');
  }

  private async validateApiKey(
    request: AuthenticatedRequest,
    apiKey: string,
  ): Promise<boolean> {
    const validApiKey = await this.apiKeysService.validateApiKey(apiKey);

    if (!validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.apiKey = validApiKey;
    request.user = validApiKey.user;
    request.authType = 'api-key';

    return true;
  }

  private async validateJwt(
    request: AuthenticatedRequest,
    authHeader: string,
  ): Promise<boolean> {
    try {
      const token = authHeader.substring(7);

      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.userId }, // or payload.userId depending on your interface
        relations: ['wallet'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      request.user = user;
      request.authType = 'jwt';

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
