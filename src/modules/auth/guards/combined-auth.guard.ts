// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { User } from 'src/entities/user.entity';
// import { ApiKeysService } from '../../api-keys/api-keys.service';

// @Injectable()
// export class CombinedAuthGuard implements CanActivate {
//   constructor(
//     private jwtService: JwtService,
//     private configService: ConfigService,
//     private apiKeysService: ApiKeysService,
//     @InjectRepository(User)
//     private userRepository: Repository<User>,
//   ) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();

//     // Check for API key first
//     const apiKey = request.headers['x-api-key'];
//     if (apiKey) {
//       return this.validateApiKey(request, apiKey);
//     }

//     // Check for JWT token
//     const authHeader = request.headers.authorization;
//     if (authHeader && authHeader.startsWith('Bearer ')) {
//       return this.validateJwt(request, authHeader);
//     }

//     throw new UnauthorizedException('No valid authentication provided');
//   }

//   private async validateApiKey(request: any, apiKey: string): Promise<boolean> {
//     const validApiKey = await this.apiKeysService.validateApiKey(apiKey);

//     if (!validApiKey) {
//       throw new UnauthorizedException('Invalid API key');
//     }

//     request.apiKey = validApiKey;
//     request.user = validApiKey.user;
//     request.authType = 'api-key';

//     return true;
//   }

//   private async validateJwt(
//     request: any,
//     authHeader: string,
//   ): Promise<boolean> {
//     try {
//       const token = authHeader.substring(7);
//       const payload = this.jwtService.verify(token, {
//         secret: this.configService.get('JWT_SECRET'),
//       });

//       const user = await this.userRepository.findOne({
//         where: { id: payload.sub },
//         relations: ['wallet'],
//       });

//       if (!user) {
//         throw new UnauthorizedException('User not found');
//       }

//       request.user = user;
//       request.authType = 'jwt';

//       return true;
//     } catch (error) {
//       throw new UnauthorizedException('Invalid token');
//     }
//   }
// }
