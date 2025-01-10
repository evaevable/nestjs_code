import { Test, TestingModule } from '@nestjs/testing';
import { TestControllerService } from './test-controller.service';

describe('TestControllerService', () => {
  let service: TestControllerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestControllerService],
    }).compile();

    service = module.get<TestControllerService>(TestControllerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
