import { Test, TestingModule } from '@nestjs/testing';
import { TestControllerController } from './test-controller.controller';
import { TestControllerService } from './test-controller.service';

describe('TestControllerController', () => {
  let controller: TestControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestControllerController],
      providers: [TestControllerService],
    }).compile();

    controller = module.get<TestControllerController>(TestControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
