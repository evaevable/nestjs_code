import { Controller, Get, Post, Body, HttpStatus, HttpException, UseFilters, ForbiddenException } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';
import { HttpExceptionFilter } from '../common/exception/http-exception.filter';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  @UseFilters(new HttpExceptionFilter())
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
    let a = 5;
    if(a === 5){
      throw new ForbiddenException();
    }
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    try{
      return this.catsService.findAll();
    } catch(error) {
      throw new HttpException({
        status: HttpStatus.FORBIDDEN,
        error: 'This is a custom message',
      }, HttpStatus.FORBIDDEN, {
        cause: error
      });
    }
  }
}