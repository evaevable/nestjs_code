import { Injectable } from '@nestjs/common';
import { CreateTestControllerDto } from './dto/create-test-controller.dto';
import { UpdateTestControllerDto } from './dto/update-test-controller.dto';

@Injectable()
export class TestControllerService {
  create(createTestControllerDto: CreateTestControllerDto) {
    return 'This action adds a new testController';
  }

  findAll() {
    return `This action returns all testController`;
  }

  findOne(id: number) {
    return `This action returns a #${id} testController`;
  }

  update(id: number, updateTestControllerDto: UpdateTestControllerDto) {
    return `This action updates a #${id} testController`;
  }

  remove(id: number) {
    return `This action removes a #${id} testController`;
  }
}
