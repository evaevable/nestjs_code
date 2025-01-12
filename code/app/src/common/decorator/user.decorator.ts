import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);


/*
这是使用的方法
@Get()
async findOne(@User('firstName') firstName: string) {
  console.log(`Hello ${firstName}`);
}

然后我们可以看到data他指的就是这些装饰器传入的参数， ctx是上下文数据，在上下文数据中找到对应的参数，
然后再从参数中找到对应data的数据
*/