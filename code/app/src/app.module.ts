import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CatsModule } from './cat/cats.module';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from './common/pipe/validation.pipe';


@Module({
  imports: [
    CatsModule,
    DatabaseModule.forRoot([])
  ],
  // providers: [
  //   {
  //     provide: APP_PIPE,
  //     useClass: ValidationPipe,
  //   }
  // ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(LoggerMiddleware)
        .forRoutes('cats')
  }
}