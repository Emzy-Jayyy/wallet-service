import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { PaystackInitializeResponse } from 'src/utils/types/paystack-initialize.interface';
import { PaystackVerifyResponse } from 'src/utils/types/paystack-verify.interface';

@Injectable()
export class PaystackService {
  private readonly paystackBaseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) throw new Error('PAYSTACK_SECRET_KEY not set in env');
    this.secretKey = key;
  }

  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
  ): Promise<PaystackInitializeResponse> {
    try {
      // Paystack expects amount in kobo (smallest currency unit)
      // If amount is in Naira, multiply by 100
      const amountInKobo = Math.round(amount * 100);
      const response = await axios.post<PaystackInitializeResponse>(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          email,
          amount: amountInKobo,
          reference,
          callback_url: `${this.configService.get('FRONTEND_URL')}/wallet/deposit/callback`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data.status) {
        throw new BadRequestException(
          'Failed to initialize Paystack transaction',
        );
      }

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as
          | { message?: string }
          | undefined;

        if (errorData?.message) {
          throw new BadRequestException(errorData.message);
        }
      }
      throw new InternalServerErrorException('Failed to initialize payment');
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    try {
      const response = await axios.get<PaystackVerifyResponse>(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      if (!response.data.status) {
        throw new BadRequestException('Failed to verify transaction');
      }

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data as
          | { message?: string }
          | undefined;

        if (errorData?.message) {
          throw new BadRequestException(errorData.message);
        }
      }
      throw new InternalServerErrorException('Failed to initialize payment');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }
}
