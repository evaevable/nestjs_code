import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TestControllerService } from './test-controller.service';
import { CreateTestControllerDto } from './dto/create-test-controller.dto';
import { UpdateTestControllerDto } from './dto/update-test-controller.dto';

@Controller('test-controller')
export class TestControllerController {
  constructor(private readonly testControllerService: TestControllerService) {}

  @Post()
  create(@Body() createTestControllerDto: CreateTestControllerDto) {
    return this.testControllerService.create(createTestControllerDto);
  }

  @Get()
  findAll() {
    return this.testControllerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.testControllerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTestControllerDto: UpdateTestControllerDto) {
    return this.testControllerService.update(+id, updateTestControllerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testControllerService.remove(+id);
  }
}
