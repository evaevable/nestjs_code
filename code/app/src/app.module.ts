import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CatsModule } from './cat/cats.module';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';


@Module({
  imports: [
    CatsModule,
    DatabaseModule.forRoot([])
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
      consumer
        .apply(LoggerMiddleware)
        .forRoutes('cats')
  }
}