# 自定义路由装饰器

Nest 是围绕一种称为装饰器的语言功能构建的。

## 参数构造器

Nest 提供了一组有用的参数装饰器，你可以将它们与 HTTP 路由处理程序一起使用。下面是提供的装饰器和它们代表的普通 Express（或 Fastify）对象的列表

@Request(), @Req()	                req
@Response(), @Res()	                res
@Next()	                            next
@Session()                      	req.session
@Param(param?: string)          	req.params / req.params[param]
@Body(param?: string)           	req.body / req.body[param]
@Query(param?: string)	            req.query / req.query[param]
@Headers(param?: string)        	req.headers / req.headers[param]
@Ip()	                            req.ip
@HostParam()	                    req.hosts

## 使用管道

Nest 以与内置装饰器（@Body()、@Param() 和 @Query()）相同的方式处理自定义参数装饰器。这意味着管道也会针对自定义注释参数执行（在我们的示例中，user 参数）。此外，你可以将管道直接应用于自定义装饰器：

```ts
@Get()
async findOne(
  @User(new ValidationPipe({ validateCustomDecorators: true }))
  user: UserEntity,
) {
  console.log(user);
}
```


请注意，validateCustomDecorators 选项必须设置为 true。默认情况下，ValidationPipe 不验证使用自定义装饰器注释的参数。


## 装饰器组成

```ts
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
```

主要部分

applyDecorators: 这是 NestJS 提供的一个函数，用于组合多个装饰器。它接收多个装饰器作为参数，并返回一个新的装饰器。这使得我们可以在一个地方定义多个装饰器的组合，简化代码的使用。

SetMetadata('roles', roles): 这个装饰器用于将角色信息存储为元数据。'roles' 是元数据的键，roles 是传入的角色数组。这个元数据可以在守卫中提取和使用，以进行角色检查。

UseGuards(AuthGuard, RolesGuard): 这个装饰器用于为控制器方法应用守卫。AuthGuard 和 RolesGuard 是两个不同的守卫：

AuthGuard: 通常用于验证用户身份（如检查 JWT 令牌）。
RolesGuard: 用于检查用户是否具有访问资源所需的角色。
ApiBearerAuth(): 这是一个 Swagger 文档相关的装饰器，用于指示该端点需要 Bearer Token 进行身份验证。这有助于在生成的 API 文档中清楚地表示需要身份验证的端点。

ApiUnauthorizedResponse({ description: 'Unauthorized' }): 另一个 Swagger 文档相关的装饰器，用于描述当请求未通过身份验证时返回的响应。这在生成的 API 文档中提供了更好的可读性和信息性。

