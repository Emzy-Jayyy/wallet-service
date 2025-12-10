import {
  IsString,
  IsArray,
  IsIn,
  ArrayMinSize,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissions: string[];

  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
