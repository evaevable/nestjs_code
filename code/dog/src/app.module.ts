import { Module } from '@nestjs/common';
import { DogsController } from './dog.controller';
import { DogsService } from './dog.service';

@Module({
  controllers: [DogsController],
  providers: [DogsService],
})
export class AppModule {}