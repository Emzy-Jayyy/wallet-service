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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
  ApiExcludeEndpoint,
  //   ApiHeader,
} from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { WalletService } from './wallet.service';
import { CombinedAuthGuard } from '../auth/guards/combined-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { User } from '../../entities/user.entity';
import { DepositDto, DepositResponseDto } from './dto/deposit.dto';
import { TransferDto, TransferResponseDto } from './dto/transfer.dto';
import { WalletBalanceDto } from './dto/wallet-balance.dto';
// import { WalletLookupDto } from './dto/wallet-lookup.dto';
import { PaystackService } from './services/payment.service';
import { DepositStatusDto } from './dto/deposit-status.dto';
import { TransactionHistoryItemDto } from './dto/transaction-history.dto';

interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    amount: number; // in kobo
    status: 'success' | 'failed';
  };
}

@ApiTags('Wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private walletService: WalletService,
    private paystackService: PaystackService,
  ) {}

  @Post('deposit')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @RequirePermission('deposit')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-KEY')
  @ApiOperation({
    summary: 'Initialize a deposit',
    description: `
      Initialize a deposit transaction using Paystack.
      
      **Authentication:** JWT or API key with 'deposit' permission
      
      **Flow:**
      1. Call this endpoint with amount
      2. Receive Paystack payment URL
      3. Redirect user to payment URL
      4. User completes payment on Paystack
      5. Paystack sends webhook to update wallet balance
      
      **Note:** Wallet is only credited after successful webhook verification
    `,
  })
  @ApiResponse({
    status: 201,
    description:
      'Deposit initialized successfully. Redirect user to authorization_url',
    type: DepositResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount or duplicate transaction',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication',
  })
  @ApiResponse({
    status: 403,
    description: 'API key does not have deposit permission',
  })
  async deposit(@CurrentUser() user: User, @Body() depositDto: DepositDto) {
    return this.walletService.initializeDeposit(user, depositDto.amount);
  }

  @Post('paystack/webhook')
  @ApiExcludeEndpoint()
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
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-KEY')
  @ApiOperation({
    summary: 'Check deposit status',
    description: `
      Check the status of a deposit transaction.
      
      **Authentication:** JWT or API key with 'read' permission
      
      **⚠️ Important:** This endpoint does NOT credit wallets. 
      Only the webhook credits wallets. This is for status checking only.
    `,
  })
  @ApiParam({
    name: 'reference',
    description: 'Deposit transaction reference',
    example: 'DEP-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @ApiResponse({
    status: 200,
    description: 'Deposit status retrieved successfully',
    type: DepositStatusDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Unauthorized access to transaction',
  })
  async getDepositStatus(
    @CurrentUser() user: User,
    @Param('reference') reference: string,
  ) {
    return this.walletService.getDepositStatus(user, reference);
  }

  @Get('balance')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @RequirePermission('read')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-KEY')
  @ApiOperation({
    summary: 'Get wallet balance',
    description: `
      Retrieve current wallet balance.
      
      **Authentication:** JWT or API key with 'read' permission
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Balance retrieved successfully',
    type: WalletBalanceDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getBalance(@CurrentUser() user: User) {
    return this.walletService.getWalletBalance(user);
  }

  @Post('transfer')
  @UseGuards(CombinedAuthGuard, PermissionsGuard)
  @RequirePermission('transfer')
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-KEY')
  @ApiOperation({
    summary: 'Transfer funds to another wallet',
    description: `
      Transfer money from your wallet to another user's wallet.
      
      **Authentication:** JWT or API key with 'transfer' permission
      
      **Validations:**
      -**Transaction:** Atomic operation - either completes fully or fails entirely
`,
  })
  @ApiResponse({
    status: 201,
    description: 'Transfer completed successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Insufficient balance, invalid amount, or daily limit exceeded',
  })
  @ApiResponse({
    status: 404,
    description: 'Recipient wallet not found',
  })
  @ApiResponse({
    status: 403,
    description: 'API key does not have transfer permission',
  })
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
  @ApiBearerAuth('JWT-auth')
  @ApiSecurity('API-KEY')
  @ApiOperation({
    summary: 'Get transaction history',
    description: `
Retrieve all wallet transactions (deposits, transfers in, transfers out).
  **Authentication:** JWT or API key with 'read' permission
  
  **Returns:** Transactions ordered by most recent first
`,
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
    type: [TransactionHistoryItemDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Wallet not found',
  })
  async getTransactions(@CurrentUser() user: User) {
    return this.walletService.getTransactionHistory(user);
  }
}
