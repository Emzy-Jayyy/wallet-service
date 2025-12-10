import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn, IsUUID } from 'class-validator';

export class RolloverApiKeyDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    description: 'UUID of the expired API key to rollover',
    required: true,
  })
  @IsUUID()
  expired_key_id: string;

  @ApiProperty({
    example: '1M',
    description: 'New expiry duration for the rolled over key',
    enum: ['1H', '1D', '1M', '1Y'],
    required: true,
  })
  @IsString()
  @IsIn(['1H', '1D', '1M', '1Y'])
  expiry: string;
}
