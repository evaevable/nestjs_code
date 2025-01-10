import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('example')
export class ExampleController {
  @Get()
  async getExample(@Res({ passthrough: true }) res: Response) {
    // 设置一个 cookie
    res.cookie('myCookie', 'cookieValue');

    // 设置一个自定义 header
    res.set('X-Custom-Header', 'customValue');

    // 返回一些数据，NestJS 将自动处理响应
    return { message: 'Hello, World!' };
  }
}

const controller = new ExampleController();
