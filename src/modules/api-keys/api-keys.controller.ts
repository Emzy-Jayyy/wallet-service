import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'src/entities/user.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { RolloverApiKeyDto } from './dto/rollover-api-key.dto';

@Controller('keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post('create')
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
  async getUserApiKeys(@CurrentUser() user: User) {
    return this.apiKeysService.getUserApiKeys(user);
  }

  @Delete(':id')
  async revokeApiKey(@CurrentUser() user: User, @Param('id') keyId: string) {
    await this.apiKeysService.revokeApiKey(user, keyId);
    return { message: 'API key revoked successfully' };
  }
}
