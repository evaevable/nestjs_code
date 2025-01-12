# Guards

守卫是一个用 @Injectable() 装饰器注释的类，它实现了 CanActivate 接口。

守卫有单一的责任。它们根据运行时存在的某些条件（如权限、角色、ACL 等）确定给定请求是否将由路由处理程序处理。这通常称为授权。授权（及其通常与之合作的身份验证）通常由传统 Express 应用中的 中间件 处理。中间件是身份验证的不错选择，因为诸如令牌验证和将属性附加到 request 对象之类的事情与特定路由上下文（及其元数据）没有紧密联系。

但是中间件，就其本质而言，是愚蠢的。它不知道调用 next() 函数后将执行哪个处理程序。另一方面，Guards 可以访问 ExecutionContext 实例，因此确切地知道接下来要执行什么。它们的设计与异常过滤器、管道和拦截器非常相似，可让你在请求/响应周期的正确位置插入处理逻辑，并以声明方式进行。这有助于使你的代码保持干爽和声明式。

守卫（guards）在所有中间件之后、任何拦截器（interceptors）或管道（pipe）之前执行。

## 授权守卫

如前所述，授权对于 Guards 来说是一个很好的用例，因为只有当调用者（通常是特定的经过身份验证的用户）拥有足够的权限时，特定的路由才应该可用。我们现在要构建的 AuthGuard 假设一个经过身份验证的用户（因此，一个令牌附加到请求标头）。它将提取并验证令牌，并使用提取的信息来确定请求是否可以继续。


```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
```


validateRequest() 函数内的逻辑可以根据需要简单或复杂。这个例子的要点是展示守卫如何适应请求/响应周期。

每个守卫都必须实现一个 canActivate() 函数。此函数应返回一个布尔值，指示是否允许当前请求。它可以同步或异步（通过 Promise 或 Observable）返回响应。Nest 使用返回值来控制下一步的动作：

如果它返回 true，请求将被处理。

如果它返回 false，Nest 将拒绝该请求。



## 执行上下文

canActivate() 函数采用单个参数，即 ExecutionContext 实例。ExecutionContext 继承自 ArgumentsHost。我们之前在异常过滤器章节中看到了 ArgumentsHost。在上面的示例中，我们只是使用我们之前在 ArgumentsHost 上定义的相同辅助方法来获取对 Request 对象的引用。

通过扩展 ArgumentsHost，ExecutionContext 还添加了几个新的辅助方法，这些方法提供有关当前执行过程的更多详细信息。这些细节有助于构建更通用的守卫，这些守卫可以在广泛的控制器、方法和执行上下文中工作。


## 绑定守卫

与管道和异常过滤器一样，守卫可以是控制器范围、方法范围或全局作用域。下面，我们使用 @UseGuards() 装饰器设置了一个控制器作用域的守卫。这个装饰器可以接受一个参数，或者一个逗号分隔的参数列表。这使你可以通过一个声明轻松应用一组适当的保护。

```ts
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
// or
@Controller('cats')
@UseGuards(new RolesGuard())
export class CatsController {}
```

全局守卫，使用 Nest 应用实例的 useGlobalGuards() 方法：

```ts
const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new RolesGuard());

```

对于混合应用，useGlobalGuards() 方法默认不会为网关和微服务设置保护

全局守卫用于整个应用，用于每个控制器和每个路由处理程序。在依赖注入方面，从任何模块外部注册的全局守卫（如上例中的 useGlobalGuards()）不能注入依赖，因为这是在任何模块的上下文之外完成的。为了解决这个问题，你可以使用以下结构直接从任何模块设置守卫：

```ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

## 为每个处理程序设置角色
我们的 RolesGuard 正在工作，但还不是很智能。我们还没有利用最重要的防护功能 - 执行上下文。它还不知道角色，或者每个处理程序允许哪些角色。例如，CatsController 可以针对不同的路由使用不同的权限方案。有些可能只对管理员用户可用，而另一些可能对所有人开放。我们如何以灵活且可重用的方式将角色与路由匹配？

这就是自定义元数据发挥作用的地方

Nest 提供了通过 Reflector#createDecorator 静态方法创建的装饰器或内置 @SetMetadata() 装饰器将自定义元数据附加到路由处理程序的功能。

例如，让我们使用 Reflector#createDecorator 方法创建一个 @Roles() 装饰器，该方法将元数据附加到处理程序。Reflector 由框架开箱即用地提供，并从 @nestjs/core 包中公开。
```ts
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```
这里的 Roles 装饰器是一个接受 string[] 类型的单个参数的函数。

现在，要使用这个装饰器，我们只需用它注释处理程序：

```ts
@Post()
@Roles(['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}

```
这里我们将 Roles 装饰器元数据附加到 create() 方法，表明只有具有 admin 角色的用户才可以访问此路由。

或者，我们可以使用内置的 @SetMetadata() 装饰器，而不是使用 Reflector#createDecorator 方法。了解有关 此处 的更多信息。

## 打个总结


现在让我们回过头来将它与我们的 RolesGuard 联系起来。目前，它在所有情况下都只返回 true，允许每个请求继续进行。我们希望通过将分配给当前用户的角色与当前正在处理的路由所需的实际角色进行比较来使返回值成为有条件的。为了访问路由的角色（自定义元数据），我们将再次使用 Reflector 辅助程序类，如下所示：

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.roles);
  }
}
```

当守卫返回 false 时，框架会抛出 ForbiddenException。如果你想返回不同的错误响应，你应该抛出你自己的特定异常。例如：


throw new UnauthorizedException();
守卫抛出的任何异常都将由 异常层（全局异常过滤器和应用于当前上下文的任何异常过滤器）处理。