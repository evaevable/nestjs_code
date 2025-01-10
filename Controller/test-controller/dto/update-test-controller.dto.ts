import { PartialType } from '@nestjs/mapped-types';
import { CreateTestControllerDto } from './create-test-controller.dto';

export class UpdateTestControllerDto extends PartialType(CreateTestControllerDto) {}
