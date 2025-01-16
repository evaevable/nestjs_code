import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'fs';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E FileTest', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should allow for file uploads', async () => {
    return request(app.getHttpServer())
      .post('/file')
      .attach('file', './package.json')
      .field('name', 'test')
      .expect(201)
      .expect({
        body: {
          name: 'test',
        },
        file: readFileSync('./package.json').toString(),
      });
  });

  it('should allow for file uploads that pass validation', async () => {
    return request(app.getHttpServer())
      .post('/file/pass-validation')
      .attach('file', './package.json')
      .field('name', 'test')
      .expect(201)
      .expect({
        body: {
          name: 'test',
        },
        file: readFileSync('./package.json').toString(),
      });
  });

  it('should throw for file uploads that do not pass validation', async () => {
    return request(app.getHttpServer())
      .post('/file/fail-validation')
      .attach('file', './package.json')
      .field('name', 'test')
      .expect(400);
  });

  it('should throw when file is required but no file is uploaded', async () => {
    return request(app.getHttpServer())
      .post('/file/fail-validation')
      .expect(400);
  });

  it('should allow for optional file uploads with validation enabled (fixes #10017)', () => {
    return request(app.getHttpServer())
      .post('/file/pass-validation')
      .expect(201);
  });

  it('should allow jpg', async () => {
    return request(app.getHttpServer()) // 获取应用的 HTTP 服务器
      .post('/file/fail-validation') // 发送 POST 请求到 /file/fail-validation 路由
      .attach('file', './image.png') // 附加文件（字段名为 file，文件路径为 ./image.jpg）
      .field('name', 'test') // 附加表单字段（字段名为 name，值为 test）
      .expect(201) // 期望服务器返回 201 状态码
      .expect({
        body: {
          name: 'test', // 期望响应体中的 body 字段包含 name: 'test'
        },
        file: readFileSync('./image.png').toString(), // 期望响应体中的 file 字段是 image.jpg 文件的内容
      });
  });  

  afterAll(async () => {
    await app.close();
  });
});