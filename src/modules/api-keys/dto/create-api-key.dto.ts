import {
  IsString,
  IsArray,
  IsIn,
  ArrayMinSize,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({
    example: 'wallet-service',
    description: 'A descriptive name for your API key',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: ['deposit', 'transfer', 'read'],
    description: 'Array of permissions for this API key',
    enum: ['deposit', 'transfer', 'read'],
    isArray: true,
    required: true,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({
    example: '1M',
    description: 'Expiry duration for the API key',
    enum: ['1H', '1D', '1M', '1Y'],
    required: true,
  })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
