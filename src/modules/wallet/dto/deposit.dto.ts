import { IsNumber, IsPositive, Min } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @IsPositive()
  @Min(100) // Minimum deposit of 100 Naira
  amount: number;
}
