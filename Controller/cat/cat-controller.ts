import {Controller, Get, Req, Post, HttpCode, Header, Query, Redirect, Body} from '@nestjs/common'
import { Request } from 'express';
import { CreateCatDto } from './dto/create-cat.dto'

@Controller('cats')
export class CatsController{
    @Get()
    findAll(): string{
        return 'This action returns all cats';
    }

    @Get('abc*d')
    findAllReq(@Req() request: Request): string {
      return 'This action returns all cats';
    }

    @Post()
    @Header('Cache-Control', 'none')
    @HttpCode(204)
    create(): string {
      return 'This action adds a new cat';
    }

    @Get('docs')
    @Redirect('https://nest.nodejs.cn', 302)
    getDocs(@Query('version') version) {
        if (version && version === '5') {
            return { url: 'https://nest.nodejs.cn/v5/' };
        }
    }

    @Get('async')
    async findAllasync(): Promise<any[]> {
    return [];
    }

    @Post()
    async createCat(@Body() createCatDto:CreateCatDto) {
        return 'This action adds a new cat';
    }

}

const catController = new CatsController();

catController.findAll();
