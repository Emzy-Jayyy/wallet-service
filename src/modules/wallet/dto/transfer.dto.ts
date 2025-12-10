import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, Length } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    example: '1234567890123',
    description: 'Recipient wallet number (13 digits)',
    minLength: 13,
    maxLength: 13,
    required: true,
  })
  @IsString()
  @Length(13, 13)
  wallet_number: string;

  @ApiProperty({
    example: 1000,
    description: 'Amount to transfer in Naira',
    minimum: 1,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}

export class TransferResponseDto {
  @ApiProperty({
    example: 'success',
    description: 'Transfer status',
  })
  status: string;

  @ApiProperty({
    example: 'Transfer of ₦1000 to John Doe completed successfully',
    description: 'Transfer message',
  })
  message: string;

  @ApiProperty({
    example: 'TRF-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    description: 'Transaction reference',
  })
  transactionReference: string;
}
