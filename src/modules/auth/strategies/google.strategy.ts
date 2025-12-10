import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleUser {
    const { id, name, emails } = profile;

    return {
      googleId: id,
      email: emails?.[0]?.value || '',
      name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
    };
  }
}

// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, StrategyOptions, Profile } from 'passport-google-oauth20';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
//   constructor(private readonly config: ConfigService) {
//     super({
//       clientID: config.get<string>('GOOGLE_CLIENT_ID') ?? '',
//       clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') ?? '',
//       callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') ?? '',
//       scope: ['email', 'profile'],
//     } as StrategyOptions);
//   }

//   validate(accessToken: string, refreshToken: string, profile: Profile) {
//     const email = profile.emails?.[0]?.value ?? null;

//     const user = {
//       googleId: profile.id ?? '',
//       email,
//       name: `${profile.name?.givenName ?? ''} ${profile.name?.familyName ?? ''}`.trim(),
//       accessToken,
//     };

//     return user;
//   }
// }
