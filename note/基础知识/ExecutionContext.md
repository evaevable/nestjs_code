# 执行上下文
Nest 提供了几个实用程序类，有助于轻松编写跨多个应用上下文（例如，基于 Nest HTTP 服务器、微服务和 WebSockets 应用上下文）运行的应用。这些实用程序提供有关当前执行上下文的信息，这些信息可用于构建通用的 guards、filters 和 interceptors，它们可以跨广泛的控制器、方法和执行上下文集工作。

## ArgumentsHost

ArgumentsHost 类提供了用于检索传递给处理程序的参数的方法。它允许选择适当的上下文（例如 HTTP、RPC（微服务）或 WebSockets）以从中检索参数。该框架在你可能想要访问它的地方提供了一个 ArgumentsHost 的实例，通常作为 host 参数引用。例如，使用 ArgumentsHost 实例调用 异常过滤器 的 catch() 方法。

ArgumentsHost 只是作为处理程序参数的抽象。例如，对于 HTTP 服务器应用（当使用 @nestjs/platform-express 时），host 对象封装了 Express 的 [request, response, next] 数组，其中 request 是请求对象，response 是响应对象，next 是控制应用请求-响应周期的函数。另一方面，对于 GraphQL 应用，host 对象包含 [root, args, context, info] 数组。

## 当前应用上下文

在构建旨在跨多个应用上下文运行的通用 guards、filters 和 interceptors 时，我们需要一种方法来确定我们的方法当前运行的应用类型。使用 ArgumentsHost 的 getType() 方法执行此操作：

```ts
if (host.getType() === 'http') {
  // do something that is only important in the context of regular HTTP requests (REST)
} else if (host.getType() === 'rpc') {
  // do something that is only important in the context of Microservice requests
} else if (host.getType<GqlContextType>() === 'graphql') {
  // do something that is only important in the context of GraphQL requests
}
```

## 主机处理程序参数

要检索传递给处理程序的参数数组，一种方法是使用宿主对象的 getArgs() 方法。

const [req, res, next] = host.getArgs();
你可以使用 getArgByIndex() 方法按索引提取特定参数：

const request = host.getArgByIndex(0);
const response = host.getArgByIndex(1);

在这些示例中，我们通过索引检索请求和响应对象，这通常不被推荐，因为它将应用耦合到特定的执行上下文。相反，你可以通过使用 host 对象的实用方法之一切换到适合你的应用的应用上下文，从而使你的代码更加健壮和可重用。上下文切换实用程序方法如下所示。

```ts
/**

 * Switch context to RPC.
 */
switchToRpc(): RpcArgumentsHost;
/**

 * Switch context to HTTP.
 */
switchToHttp(): HttpArgumentsHost;
/**

 * Switch context to WebSockets.
 */
switchToWs(): WsArgumentsHost;
```

WsArgumentsHost 和 RpcArgumentsHost 具有在微服务和 WebSockets 上下文中返回适当对象的方法。

以下是 WsArgumentsHost 的方法：
```ts
export interface WsArgumentsHost {
  /**

   * Returns the data object.
   */
  getData<T>(): T;
  /**

   * Returns the client object.
   */
  getClient<T>(): T;
}
```

以下是 RpcArgumentsHost 的方法：

```ts
export interface RpcArgumentsHost {
  /**

   * Returns the data object.
   */
  getData<T>(): T;

  /**

   * Returns the context object.
   */
  getContext<T>(): T;
}
```

## ExecutionContext class

ExecutionContext 扩展 ArgumentsHost，提供有关当前执行过程的更多详细信息。与 ArgumentsHost 一样，Nest 在你可能需要的地方提供了 ExecutionContext 的实例，例如 guard 的 canActivate() 方法和 interceptor 的 intercept() 方法。它提供了以下方法

```ts
export interface ExecutionContext extends ArgumentsHost {
  /**

   * Returns the type of the controller class which the current handler belongs to.
   */
  getClass<T>(): Type<T>;
  /**

   * Returns a reference to the handler (method) that will be invoked next in the

   * request pipeline.
   */
  getHandler(): Function;
}
```

访问对当前类和处理程序方法的引用的能力提供了极大的灵活性。最重要的是，它使我们有机会通过 Reflector#createDecorator 创建的装饰器或来自守卫或拦截器内的内置 @SetMetadata() 装饰器来访问元数据集。


## Reflection and metadata

Nest 提供了通过 Reflector#createDecorator 方法创建的装饰器和内置 @SetMetadata() 装饰器将自定义元数据附加到路由处理程序的功能。

要使用 Reflector#createDecorator 创建强类型装饰器，我们需要指定类型参数。例如，让我们创建一个 Roles 装饰器，它将字符串数组作为参数。

import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();

这里的 Roles 装饰器是一个接受 string[] 类型的单个参数的函数。

现在，要使用这个装饰器，我们只需用它注释处理程序：

@Post()
@Roles(['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}


要读取处理程序元数据，请使用 get() 方法：

const roles = this.reflector.get(Roles, context.getHandler());

Reflector#get 方法允许我们通过传入两个参数轻松访问元数据：装饰器引用和从中检索元数据的上下文（装饰器目标）。在这个例子中，指定的装饰器是 Roles（参考上面的 roles.decorator.ts 文件）。上下文由对 context.getHandler() 的调用提供，这会导致为当前处理的路由处理程序提取元数据。请记住，getHandler() 为我们提供了路由处理函数的引用。

针对某些方法有选择地覆盖，使用 getAllAndOverride() 方法。

const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);

获取两者的元数据并将其合并使用 getAllAndMerge() 方法：

const roles = this.reflector.getAllAndMerge(Roles, [context.getHandler(), context.getClass()]);


## 底层方法
使用内置的 @SetMetadata() 装饰器来将元数据附加到处理程序，而不是使用 Reflector#createDecorator。

@Post()
@SetMetadata('roles', ['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}

通过上面的构造，我们将 roles 元数据（roles 是元数据键，['admin'] 是关联值）附加到 create() 方法。虽然这可行，但在你的路由中直接使用 @SetMetadata() 并不是好的做法。相反，你可以创建自己的装饰器，如下所示：

import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);


这种方法更简洁、更具可读性，并且有点类似于 Reflector#createDecorator 方法。不同之处在于，使用 @SetMetadata，你可以更好地控制元数据键和值，并且还可以创建采用多个参数的装饰器。

现在我们有了一个自定义的 @Roles() 装饰器，我们可以用它来装饰 create() 方法。

@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}



