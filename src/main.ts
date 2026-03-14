import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisIoAdapter } from './common/adapters/redis-io.adapter';
import cookieParser from 'cookie-parser';
import { TransformInterceptor } from './interceptor/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const redisIoAdapter = new RedisIoAdapter(app, configService);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
  app.use(cookieParser());
  const options = new DocumentBuilder()
    .setTitle('Trip Nest Api')
    .setDescription('The Trip Nest API description')
    .setVersion('1.0')
    .addTag('trip nest')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({
    origin: 'http://localhost:3000',
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  await app.listen(configService.get('PORT') ?? 3000);
}
bootstrap();
