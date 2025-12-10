import {
  Controller,
  Get,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  // ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import type { GoogleUser } from '../../utils/types/google-user.interface';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponseDto } from './dto/google-user.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Initiate Google OAuth sign-in',
    description:
      'Redirects user to Google OAuth consent screen. After user grants permission, Google will redirect back to the callback URL.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen',
  })
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: `
      Google redirects here after user authentication. 
      This endpoint:
      - Creates user if not existing
      - Creates wallet automatically
      - Returns JWT token for subsequent requests
    `,
  })
  @ApiResponse({
    status: 200,
    description:
      'Successfully authenticated. Returns JWT token and user details',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
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
