import { ApiProperty } from '@nestjs/swagger';

export class TransactionHistoryItemDto {
  @ApiProperty({
    example: 'deposit',
    enum: ['deposit', 'transfer', 'transfer_in'],
    description: 'Type of transaction',
  })
  type: string;

  @ApiProperty({
    example: 5000,
    description: 'Transaction amount in Naira',
  })
  amount: number;

  @ApiProperty({
    example: 'success',
    enum: ['pending', 'success', 'failed'],
    description: 'Transaction status',
  })
  status: string;

  @ApiProperty({
    example: '2024-12-10T12:00:00Z',
    description: 'Transaction timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: 'DEP-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    description: 'Transaction reference',
    required: false,
  })
  reference?: string;

  @ApiProperty({
    example: '1234567890123',
    description: 'Recipient wallet number (for transfers)',
    required: false,
  })
  recipientWalletNumber?: string;
}
