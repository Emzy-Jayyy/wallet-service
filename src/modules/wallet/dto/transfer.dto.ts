import { IsString, IsNumber, IsPositive, Length } from 'class-validator';

export class TransferDto {
  @IsString()
  @Length(13, 13)
  wallet_number: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
