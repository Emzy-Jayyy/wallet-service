import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';
import { ApiKeyListItemDto, ApiKeyResponseDto } from './dto/api-key-list.dto';

@ApiTags('API Keys')
@Controller('keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Create a new API key',
    description: `
      Create a new API key for service-to-service authentication.
      
      **Rules:**
      - Maximum 5 active API keys per user
      - Permissions must be explicitly assigned
      - Expiry formats: 1H (1 hour), 1D (1 day), 1M (1 month), 1Y (1 year)
      
      **⚠️ Important:** Save the returned API key securely. It will not be shown again!
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid permissions or expiry format',
  })
  @ApiResponse({
    status: 403,
    description: 'Maximum of 5 active API keys reached',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async createApiKey(
    @CurrentUser() user: User,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.createApiKey(
      user,
      createApiKeyDto.name,
      createApiKeyDto.permissions,
      createApiKeyDto.expiry,
    );
  }

  @Post('rollover')
  @ApiOperation({
    summary: 'Rollover an expired API key',
    description: `
      Create a new API key using the same permissions as an expired key.
      
      **Rules:**
      - The old key must be expired
      - New key inherits same permissions
      - Counts toward the 5 active keys limit
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'API key rolled over successfully',
    type: ApiKeyResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'API key is not expired or invalid expiry format',
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Maximum of 5 active API keys reached',
  })
  async rolloverApiKey(
    @CurrentUser() user: User,
    @Body() rolloverApiKeyDto: RolloverApiKeyDto,
  ) {
    return this.apiKeysService.rolloverApiKey(
      user,
      rolloverApiKeyDto.expired_key_id,
      rolloverApiKeyDto.expiry,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List all API keys',
    description:
      'Get a list of all your API keys (active and expired). The actual key value is not returned for security.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of API keys retrieved successfully',
    type: [ApiKeyListItemDto],
  })
  async getUserApiKeys(@CurrentUser() user: User) {
    return this.apiKeysService.getUserApiKeys(user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Revoke an API key',
    description: 'Permanently revoke an API key. This action cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    description: 'API key UUID',
    example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
  })
  @ApiResponse({
    status: 200,
    description: 'API key revoked successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'API key revoked successfully' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found',
  })
  async revokeApiKey(@CurrentUser() user: User, @Param('id') keyId: string) {
    await this.apiKeysService.revokeApiKey(user, keyId);
    return { message: 'API key revoked successfully' };
  }
}
