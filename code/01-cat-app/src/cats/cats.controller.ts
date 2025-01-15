import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { CatsService } from "./cats.service";
import { CreateCatDto } from "./dto/create-cat.dto";
import { Cat } from "./interfaces/cat.interface";
import { Roles } from "../common/decorators/role.decorator";
import { RoleGuard } from "src/common/guards/role.guard";

@UseGuards(RoleGuard)
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}


  @Post()
  @Roles(['admin'])
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number){
    return id;
  }
}