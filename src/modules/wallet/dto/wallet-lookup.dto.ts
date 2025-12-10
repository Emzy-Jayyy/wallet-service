import { ApiProperty } from '@nestjs/swagger';

export class WalletLookupDto {
  @ApiProperty({
    example: '1234567890123',
    description: 'Wallet number',
  })
  walletNumber: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Account holder name',
  })
  accountName: string;
}
