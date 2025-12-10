import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
// import { json } from 'express';
// import * as bodyParser from 'body-parser';
// import type { Request } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.setGlobalPrefix('api/v1');
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

  // app.use(
  //   bodyParser.json({
  //     verify: (req: Request, _res, buf: Buffer) => {
  //       req.rawBody = buf;
  //     },
  //   }),
  // );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
