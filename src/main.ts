import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json } from 'express';
import type { Request } from 'express';
import type { OpenAPIObject } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(
    json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USER:', process.env.DB_USER);

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Wallet Service API')
    .setDescription(
      `
      ## Wallet Service with Paystack Integration
      
      A comprehensive backend wallet service that allows users to:
      - Deposit money using Paystack
      - Manage wallet balances
      - View transaction history
      - Transfer funds to other users
      
      ### Authentication Methods
      
      This API supports two authentication methods:
      
      1. **JWT Authentication**: Use Bearer token from Google sign-in
         - Add to headers: \`Authorization: Bearer <token>\`
      
      2. **API Key Authentication**: Use API keys for service-to-service access
         - Add to headers: \`x-api-key: <your-api-key>\`
      
      ### Getting Started
      
      1. Sign in with Google to get JWT token
      2. Create API keys with specific permissions
      3. Use either JWT or API key to access wallet endpoints
      
      ### Features
      
      - ✅ Google OAuth Authentication
      - ✅ JWT & API Key Support
      - ✅ Paystack Deposit Integration
      - ✅ Secure Webhook Handling
      - ✅ Wallet-to-Wallet Transfers
      - ✅ Permission-Based Access Control
      - ✅ Transaction History
      - ✅ API Key Management (Max 5 active keys)
      `,
    )
    .setVersion('1.0')
    .setContact(
      'Your Name',
      'https://your-website.com',
      'your-email@example.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('Authentication', 'Google OAuth and JWT token endpoints')
    .addTag('API Keys', 'API key management for service-to-service access')
    .addTag('Wallet', 'Wallet operations: deposits, transfers, balance')
    .addTag('Transactions', 'Transaction history and details')
    .addTag('Health', 'Health check endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token from Google authentication',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Enter your API key for service-to-service authentication',
      },
      'API-KEY',
    )
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://your-production-url.com', 'Production Server')
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Wallet Service API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
