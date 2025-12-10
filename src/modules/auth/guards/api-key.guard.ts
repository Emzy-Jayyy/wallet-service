import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    const validApiKey = await this.apiKeysService.validateApiKey(apiKey);

    if (!validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach the API key and user to the request
    request.apiKey = validApiKey;
    request.user = validApiKey.user;

    return true;
  }
}
