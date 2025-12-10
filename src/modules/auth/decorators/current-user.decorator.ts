import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GoogleUser } from 'src/utils/types/google-user.interface';
import { RequestWithUser } from 'src/utils/types/request-with-user.interface';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): GoogleUser => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
