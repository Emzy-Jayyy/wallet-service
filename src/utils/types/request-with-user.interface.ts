import { GoogleUser } from './google-user.interface';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: GoogleUser;
}
