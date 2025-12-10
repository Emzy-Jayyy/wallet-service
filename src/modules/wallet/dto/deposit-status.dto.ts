import { ApiProperty } from '@nestjs/swagger';

export class DepositStatusDto {
  @ApiProperty({
    example: 'DEP-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    description: 'Transaction reference',
  })
  reference: string;

  @ApiProperty({
    example: 'success',
    enum: ['pending', 'success', 'failed'],
    description: 'Current status of the deposit',
  })
  status: string;

  @ApiProperty({
    example: 5000,
    description: 'Deposit amount in Naira',
  })
  amount: number;
}
