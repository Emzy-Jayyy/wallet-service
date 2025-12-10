import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GoogleUser } from '../../utils/types/google-user.interface';
import { RequestWithUser } from '../../utils/types/request-with-user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): GoogleUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
