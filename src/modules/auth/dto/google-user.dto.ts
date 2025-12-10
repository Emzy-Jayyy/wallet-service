import { ApiProperty } from '@nestjs/swagger';

export class GoogleUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email from Google',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name from Google',
  })
  name: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Google user ID',
  })
  googleId: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', example: 'uuid-here' },
      email: { type: 'string', example: 'user@example.com' },
      name: { type: 'string', example: 'John Doe' },
      walletNumber: { type: 'string', example: '1234567890123' },
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
    walletNumber: string;
  };
}
