import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyListItemDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    description: 'API key UUID',
  })
  id: string;

  @ApiProperty({
    example: 'wallet-service',
    description: 'API key name',
  })
  name: string;

  @ApiProperty({
    example: ['deposit', 'transfer', 'read'],
    description: 'Permissions assigned to this key',
  })
  permissions: string[];

  @ApiProperty({
    example: '2025-01-10T12:00:00Z',
    description: 'When the key expires',
  })
  expiresAt: Date;

  @ApiProperty({
    example: false,
    description: 'Whether the key has been revoked',
  })
  isRevoked: boolean;

  @ApiProperty({
    example: '2024-12-10T12:00:00Z',
    description: 'When the key was created',
  })
  createdAt: Date;
}

export class ApiKeyResponseDto {
  @ApiProperty({
    example: 'sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    description: 'Your generated API key - save this securely!',
  })
  api_key: string;

  @ApiProperty({
    example: '2025-01-10T12:00:00Z',
    description: 'Expiration date of the API key',
  })
  expires_at: Date;
}
