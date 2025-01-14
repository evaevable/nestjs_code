import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CatsModule } from './cat/cats.module';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from './common/pipe/validation.pipe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';


@Module({
  imports: [
    CatsModule,
    DatabaseModule.forRoot([]),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true,
    })
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