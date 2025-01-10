import { Module } from '@nestjs/common';
import { TestControllerService } from './test-controller.service';
import { TestControllerController } from './test-controller.controller';

@Module({
  controllers: [TestControllerController],
  providers: [TestControllerService],
})
export class TestControllerModule {}
