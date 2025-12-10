import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Wallet } from '../../entities/wallet.entity';
import { JwtPayload } from '../../utils/types/auth-user.type';
import { GoogleUser } from '../../utils/types/google-user.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { googleId: googleUser.googleId },
      relations: ['wallet'],
    });

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
      });
      await this.userRepository.save(user);

      // Create wallet for user
      const walletNumber = this.generateWalletNumber();
      const wallet = this.walletRepository.create({
        walletNumber,
        user,
        userId: user.id,
        balance: 0,
      });
      await this.walletRepository.save(wallet);

      user.wallet = wallet;
    }

    return user;
  }

  generateJwtToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }

  private generateWalletNumber(): string {
    // Generate 13-digit wallet number
    return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
  }
}
