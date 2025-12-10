import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../../entities/wallet.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../../entities/transaction.entity';
import { User } from '../../entities/user.entity';
import { PaystackService } from './services/payment.service';
import { v4 as uuidv4 } from 'uuid';

interface PaystackWebhookPayload {
  event: string;
  data: {
    reference: string;
    amount: number;
    status: 'success' | 'failed';
  };
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    private paystackService: PaystackService,
    private dataSource: DataSource,
  ) {}

  async getWalletBalance(user: User): Promise<{ balance: number }> {
    const wallet = await this.walletRepository.findOne({
      where: { userId: user.id },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return { balance: Number(wallet.balance) };
  }

  async initializeDeposit(
    user: User,
    amount: number,
  ): Promise<{ reference: string; authorization_url: string }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const wallet = await this.walletRepository.findOne({
      where: { userId: user.id },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Generate unique reference
    const reference = `DEP-${uuidv4()}`;

    // Check if reference already exists (idempotency)
    const existingTransaction = await this.transactionRepository.findOne({
      where: { reference },
    });

    if (existingTransaction) {
      throw new BadRequestException('Duplicate transaction reference');
    }

    // Create pending transaction
    const transaction = this.transactionRepository.create({
      reference,
      type: TransactionType.DEPOSIT,
      amount,
      status: TransactionStatus.PENDING,
      wallet,
      walletId: wallet.id,
    });

    await this.transactionRepository.save(transaction);

    // Initialize Paystack transaction
    const paystackResponse = await this.paystackService.initializeTransaction(
      user.email,
      amount,
      reference,
    );

    return {
      reference: paystackResponse.data.reference,
      authorization_url: paystackResponse.data.authorization_url,
    };
  }

  async handlePaystackWebhook(payload: PaystackWebhookPayload): Promise<void> {
    const { event, data } = payload;

    // Only process successful charge events
    if (event !== 'charge.success') {
      return;
    }

    const { reference, amount, status } = data;

    // Find the transaction
    const transaction = await this.transactionRepository.findOne({
      where: { reference },
      relations: ['wallet'],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with reference ${reference} not found`,
      );
    }

    // Idempotency check - if already processed, skip
    if (transaction.status === TransactionStatus.SUCCESS) {
      console.log(`Transaction ${reference} already processed`);
      return;
    }

    // Use transaction to ensure atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Convert amount from kobo to naira
      const amountInNaira: number = amount / 100;

      // Verify amounts match
      if (Number(transaction.amount) !== amountInNaira) {
        throw new BadRequestException('Amount mismatch');
      }

      // Update transaction status
      transaction.status =
        status === 'success'
          ? TransactionStatus.SUCCESS
          : TransactionStatus.FAILED;

      await queryRunner.manager.save(transaction);

      // Credit wallet only if payment was successful
      if (status === 'success') {
        const wallet = transaction.wallet;
        wallet.balance = Number(wallet.balance) + amountInNaira;
        await queryRunner.manager.save(wallet);
      }

      await queryRunner.commitTransaction();
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to process webhook');
    } finally {
      await queryRunner.release();
    }
  }

  async getDepositStatus(
    user: User,
    reference: string,
  ): Promise<{ reference: string; status: TransactionStatus; amount: number }> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        reference,
        type: TransactionType.DEPOSIT,
      },
      relations: ['wallet'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify the transaction belongs to the user
    if (transaction.wallet.userId !== user.id) {
      throw new BadRequestException('Unauthorized access to transaction');
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: Number(transaction.amount),
    };
  }

  async getTransactionHistory(user: User): Promise<
    Array<{
      type: string;
      amount: number;
      status: string;
      createdAt: Date;
      reference?: string;
    }>
  > {
    const wallet = await this.walletRepository.findOne({
      where: { userId: user.id },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    const transactions = await this.transactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
    });

    return transactions.map((txn) => ({
      type: txn.type,
      amount: Number(txn.amount),
      status: txn.status,
      createdAt: txn.createdAt,
      reference: txn.reference,
      ...(txn.recipientWalletNumber && {
        recipientWalletNumber: txn.recipientWalletNumber,
      }),
    }));
  }

  async transferToWallet(
    user: User,
    recipientWalletNumber: string,
    amount: number,
  ): Promise<{ status: string; message: string }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Get sender's wallet
    const senderWallet = await this.walletRepository.findOne({
      where: { userId: user.id },
    });

    if (!senderWallet) {
      throw new NotFoundException('Sender wallet not found');
    }

    // Check if sender has sufficient balance
    if (Number(senderWallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Get recipient's wallet
    const recipientWallet = await this.walletRepository.findOne({
      where: { walletNumber: recipientWalletNumber },
    });

    if (!recipientWallet) {
      throw new NotFoundException('Recipient wallet not found');
    }

    // Prevent self-transfer
    if (senderWallet.id === recipientWallet.id) {
      throw new BadRequestException('Cannot transfer to yourself');
    }

    // Use transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deduct from sender
      senderWallet.balance = Number(senderWallet.balance) - amount;
      await queryRunner.manager.save(senderWallet);

      // Add to recipient
      recipientWallet.balance = Number(recipientWallet.balance) + amount;
      await queryRunner.manager.save(recipientWallet);

      // Create debit transaction for sender
      const debitTransaction = this.transactionRepository.create({
        type: TransactionType.TRANSFER,
        amount,
        status: TransactionStatus.SUCCESS,
        wallet: senderWallet,
        walletId: senderWallet.id,
        recipientWalletNumber,
        reference: `TRF-${uuidv4()}`,
      });
      await queryRunner.manager.save(debitTransaction);

      // Create credit transaction for recipient
      const creditTransaction = this.transactionRepository.create({
        type: TransactionType.TRANSFER_IN,
        amount,
        status: TransactionStatus.SUCCESS,
        wallet: recipientWallet,
        walletId: recipientWallet.id,
        metadata: JSON.stringify({ from: senderWallet.walletNumber }),
        reference: `TRF-IN-${uuidv4()}`,
      });
      await queryRunner.manager.save(creditTransaction);

      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message: 'Transfer completed',
      };
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Transfer failed');
    } finally {
      await queryRunner.release();
    }
  }
}
