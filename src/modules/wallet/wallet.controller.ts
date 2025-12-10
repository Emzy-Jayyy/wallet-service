import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { WalletService } from './wallet.service';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { User } from 'src/entities/user.entity';
import { DepositDto } from './dto/deposit.dto';
import { TransferDto } from './dto/transfer.dto';
import { PaystackService } from './services/payment.service';

interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    amount: number; // in kobo
    status: 'success' | 'failed';
  };
}

@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private paystackService: PaystackService,
  ) {}

  @Post('deposit')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @RequirePermission('deposit')
  async deposit(@CurrentUser() user: User, @Body() depositDto: DepositDto) {
    return this.walletService.initializeDeposit(user, depositDto.amount);
  }

  @Post('paystack/webhook')
  async handlePaystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('No signature provided');
    }
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    // Get raw body for signature verification
    const rawBody = req.rawBody.toString('utf8');

    // const rawBody = req.body;
    // const bodyString = JSON.stringify(rawBody);

    // Verify signature
    const isValid = this.paystackService.verifyWebhookSignature(
      //   bodyString,
      rawBody,
      signature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    // Process webhook
    // await this.walletService.handlePaystackWebhook(rawBody);
    await this.walletService.handlePaystackWebhook(
      req.body as PaystackWebhookPayload,
    );

    return { status: true };
  }

  @Get('deposit/:reference/status')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @RequirePermission('read')
  async getDepositStatus(
    @CurrentUser() user: User,
    @Param('reference') reference: string,
  ) {
    return this.walletService.getDepositStatus(user, reference);
  }

  @Get('balance')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @RequirePermission('read')
  async getBalance(@CurrentUser() user: User) {
    return this.walletService.getWalletBalance(user);
  }

  @Post('transfer')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @RequirePermission('transfer')
  async transfer(@CurrentUser() user: User, @Body() transferDto: TransferDto) {
    return this.walletService.transferToWallet(
      user,
      transferDto.wallet_number,
      transferDto.amount,
    );
  }

  @Get('transactions')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @RequirePermission('read')
  async getTransactions(@CurrentUser() user: User) {
    return this.walletService.getTransactionHistory(user);
  }
}
