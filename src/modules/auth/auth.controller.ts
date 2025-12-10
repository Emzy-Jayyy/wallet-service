import {
  Controller,
  Get,
  //   Req,
  //   Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { GoogleUser } from 'src/utils/types/google-user.interface';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@CurrentUser() googleUser: GoogleUser) {
    if (!googleUser) {
      throw new BadRequestException('Google authentication failed');
    }

    const user = await this.authService.validateGoogleUser(googleUser);
    const token = this.authService.generateJwtToken(user);

    //return JSON
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletNumber: user.wallet.walletNumber,
      },
    };
  }
}
