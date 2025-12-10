import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),

    // host: configService.get<string>('DB_HOST'),
    // port: configService.get<number>('DB_PORT') || 5432,
    // username: configService.get<string>('DB_USERNAME'),
    // password: configService.get<string>('DB_PASSWORD') || '', // Ensure it's a string
    // database: configService.get<string>('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    autoLoadEntities: true,

    synchronize: configService.get<string>('NODE_ENV') !== 'production',

    migrationsRun: true,
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],

    logging: process.env.NODE_ENV !== 'production',
    ssl: {
      rejectUnauthorized: false,
    },
  };
};
