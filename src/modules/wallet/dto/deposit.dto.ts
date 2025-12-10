import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty({
    example: 5000,
    description: 'Amount to deposit in Naira (minimum: 100)',
    minimum: 100,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  @Min(100)
  amount: number;
}

export class DepositResponseDto {
  @ApiProperty({
    example: 'DEP-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    description: 'Unique transaction reference',
  })
  reference: string;

  @ApiProperty({
    example: 'https://checkout.paystack.com/abc123xyz',
    description:
      'Paystack payment URL - redirect user here to complete payment',
  })
  authorization_url: string;
}
