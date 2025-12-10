import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceDto {
  @ApiProperty({
    example: 15000.5,
    description: 'Current wallet balance in Naira',
  })
  balance: number;
}
