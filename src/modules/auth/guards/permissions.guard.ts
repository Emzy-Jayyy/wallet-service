import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../../api-keys/api-keys.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // If authenticated via JWT, allow all actions
    if (request.authType === 'jwt') {
      return true;
    }

    // If authenticated via API key, check permissions
    if (request.authType === 'api-key' && request.apiKey) {
      const hasPermission = this.apiKeysService.hasPermission(
        request.apiKey,
        requiredPermission,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `This API key does not have '${requiredPermission}' permission`,
        );
      }

      return true;
    }

    return false;
  }
}
