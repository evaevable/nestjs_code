# Exception Filters

Nest 带有一个内置的异常层，负责处理应用中所有未处理的异常。当你的应用代码未处理异常时，该层会捕获该异常，然后自动发送适当的用户友好响应。

## 抛出标准异常

Nest 提供了一个内置的 HttpException 类，从 @nestjs/common 包中暴露出来。对于典型的基于 HTTP REST/GraphQL API 的应用，最佳做法是在发生某些错误情况时发送标准 HTTP 响应对象。

例如，在 CatsController 中，我们有一个 findAll() 方法（一个 GET 路由处理程序）。假设此路由处理程序出于某种原因抛出异常。为了证明这一点，我们将硬编码如下：

```ts
@Get()
async findAll() {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
```

我们这里使用的是 HttpStatus。这是从 @nestjs/common 包导入的辅助枚举。

当客户端调用此端点时，响应如下所示：


{
  "statusCode": 403,
  "message": "Forbidden"
}

HttpException 构造函数采用两个必需的参数来确定响应：

response 参数定义 JSON 响应主体。它可以是 string 或 object。

status 参数定义了 HTTP 状态代码。

默认情况下，JSON 响应主体包含两个属性：

statusCode：默认为 status 参数中提供的 HTTP 状态代码

message：基于 status 的 HTTP 错误的简短描述

要仅覆盖 JSON 响应正文的消息部分，请在 response 参数中提供一个字符串。要覆盖整个 JSON 响应主体，请在 response 参数中传递一个对象。Nest 将序列化该对象并将其作为 JSON 响应主体返回。

第二个构造函数参数 - status - 应该是有效的 HTTP 状态代码。最佳做法是使用从 @nestjs/common 导入的 HttpStatus 枚举。

有第三个构造函数参数（可选） - options - 可用于提供错误 cause。此 cause 对象未序列化到响应对象中，但它可用于记录目的，提供有关导致 HttpException 被抛出的内部错误的有价值信息。

## 自定义异常
在许多情况下，你不需要编写自定义异常，并且可以使用内置的 Nest HTTP 异常，如下一节所述。如果你确实需要创建自定义异常，那么最好创建你自己的异常层次结构，其中你的自定义异常继承自 HttpException 基类。通过这种方法，Nest 将识别你的异常，并自动处理错误响应。让我们实现这样一个自定义异常：

export class ForbiddenException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}

## 内置HTTP异常

Nest 提供了一组继承自基 HttpException 的标准异常。这些是从 @nestjs/common 包中公开的，代表了许多最常见的 HTTP 异常：

BadRequestException

UnauthorizedException

NotFoundException

ForbiddenException

NotAcceptableException

RequestTimeoutException

ConflictException

GoneException

HttpVersionNotSupportedException

PayloadTooLargeException

UnsupportedMediaTypeException

UnprocessableEntityException

InternalServerErrorException

NotImplementedException

ImATeapotException

MethodNotAllowedException

BadGatewayException

ServiceUnavailableException

GatewayTimeoutException

PreconditionFailedException

所有内置异常也可以使用 options 参数提供错误 cause 和错误描述：

throw new BadRequestException('Something bad happened', { cause: new Error(), description: 'Some error description' })


使用上面的内容，这就是响应的样子：


{
  "message": "Something bad happened",
  "error": "Some error description",
  "statusCode": 400,
}

## 异常过滤器

虽然基本（内置）异常过滤器可以自动为你处理许多情况，但你可能希望完全控制异常层。例如，你可能希望根据某些动态因素添加日志记录或使用不同的 JSON 模式。异常过滤器正是为此目的而设计的。它们让你可以控制准确的控制流和发送回客户端的响应内容。

让我们创建一个异常过滤器，负责捕获作为 HttpException 类实例的异常，并为它们实现自定义响应逻辑。为此，我们需要访问底层平台 Request 和 Response 对象。我们将访问 Request 对象，以便提取原始 url 并将其包含在日志信息中。我们将使用 Response 对象直接控制发送的响应，使用 response.json() 方法。

```ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // exception 参数: 捕获的异常对象。
    // host 参数: 提供对当前请求上下文的访问。
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}

// host.switchToHttp(): 将上下文切换到 HTTP 上下文，以便访问 HTTP 请求和响应对象。
// ctx.getResponse<Response>(): 获取 Express 的响应对象。
// ctx.getRequest<Request>(): 获取 Express 的请求对象。
// exception.getStatus(): 从 HttpException 对象中获取 HTTP 状态码。

// response.status(status): 设置响应的 HTTP 状态码。
// .json({...}): 发送一个 JSON 格式的响应体。
// statusCode: 包含异常的状态码。
// timestamp: 当前时间戳，表示异常发生的时间。
// path: 请求的 URL 路径。

```

所有异常过滤器都应实现通用 ExceptionFilter<T> 接口。这要求你提供 catch(exception: T, host: ArgumentsHost) 方法及其指示的签名。T 表示异常的类型。

@Catch(HttpException) 装饰器将所需的元数据绑定到异常过滤器，告诉 Nest 这个特定的过滤器正在寻找 HttpException 类型的异常，而不是其他任何东西。@Catch() 装饰器可以采用单个参数或逗号分隔的列表。这使你可以一次为多种类型的异常设置过滤器。

## 参数主机

我们看一下 catch() 方法的参数。exception 参数是当前正在处理的异常对象。host 参数是一个 ArgumentsHost 对象。ArgumentsHost 是一个强大的实用程序对象.我们使用它来获取对传递给原始请求处理程序（在异常产生的控制器中）的 Request 和 Response 对象的引用。在此代码示例中，我们在 ArgumentsHost 上使用了一些辅助方法来获取所需的 Request 和 Response 对象。

这种抽象级别的原因是 ArgumentsHost 在所有上下文中都起作用（例如，我们现在使用的 HTTP 服务器上下文，还有微服务和 WebSockets）。

### ArgumentsHost

ArgumentsHost 是 NestJS 提供的一个抽象接口，用于在不同的上下文中访问请求处理的相关信息。NestJS 支持多种上下文，包括 HTTP、微服务和 WebSockets。ArgumentsHost 提供了一种统一的方式来访问这些上下文中的请求和响应对象。

各种上下文的解释

HTTP 上下文: 这是最常见的上下文，处理来自 HTTP 客户端的请求。ArgumentsHost 可以用来访问 Express 或 Fastify 的请求和响应对象。

微服务上下文: 在微服务架构中，服务之间通过消息传递进行通信。ArgumentsHost 可以用来访问消息传递的上下文信息。

WebSockets 上下文: WebSockets 提供了一种在客户端和服务器之间进行双向通信的方式。ArgumentsHost 可以用来访问 WebSocket 连接的上下文信息。


```ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class AllContextExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const contextType = host.getType(); // 获取上下文类型

    if (contextType === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const request = ctx.getRequest();
      const status = exception.getStatus();

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    } else if (contextType === 'rpc') {
      const ctx = host.switchToRpc();
      const data = ctx.getData();
      // 处理微服务上下文中的异常
      console.error('Microservice exception:', exception.message, data);
    } else if (contextType === 'ws') {
      const ctx = host.switchToWs();
      const client = ctx.getClient();
      // 处理 WebSocket 上下文中的异常
      client.emit('exception', {
        status: 'error',
        message: exception.message,
      });
    }
  }
}

```

通过使用 ArgumentsHost，你可以在一个过滤器中处理不同类型的上下文，而不需要为每种上下文编写单独的逻辑。

## 绑定过滤器

```ts
@Post()
@UseFilters(new HttpExceptionFilter())
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
```

这里使用了 @UseFilters() 装饰器。类似于 @Catch() 装饰器，它可以采用单个过滤器实例，或以逗号分隔的过滤器实例列表。在这里，我们就地创建了 HttpExceptionFilter 的实例。或者，你可以传递类（而不是实例），将实例化的责任留给框架，并启用依赖注入。


```ts
@Post()
@UseFilters(HttpExceptionFilter)
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
```

ps: 尽可能使用类而不是实例来应用过滤器。它减少了内存使用量，因为 Nest 可以轻松地在整个模块中重用同一类的实例。


在上面的示例中，HttpExceptionFilter 仅应用于单个 create() 路由处理程序，使其具有方法作用域。异常过滤器可以在不同级别作用域内：控制器/解析器/网关的方法作用域、控制器作用域或全局作用域。例如，要将过滤器设置为控制器作用域，你可以执行以下操作：

```ts
@UseFilters(new HttpExceptionFilter())
export class CatsController {}
```
此构造为 CatsController 中定义的每个路由处理程序设置 HttpExceptionFilter。

要创建全局作用域的过滤器，你可以执行以下操作：
```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
```

全局作用域的过滤器用于整个应用，用于每个控制器和每个路由处理程序。在依赖注入方面，从任何模块外部注册的全局过滤器（如上例中的 useGlobalFilters()）不能注入依赖，因为这是在任何模块的上下文之外完成的。为了解决此问题，你可以使用以下结构直接从任何模块注册全局作用域的过滤器：

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

### useGlobalFilters() 方法不为网关或混合应用设置过滤器。

在 NestJS 中，useGlobalFilters() 方法用于为整个应用程序设置全局异常过滤器。这意味着所有通过 HTTP 请求处理的异常都会被这个全局过滤器捕获和处理。然而，这个方法的作用范围主要是针对 HTTP 请求上下文。

网关和混合应用

网关（Gateways）: 在 NestJS 中，网关通常用于处理 WebSockets 或其他实时通信协议。网关有自己的上下文和生命周期，与 HTTP 请求处理不同。

混合应用（Hybrid Applications）: 指的是同时使用多种通信协议的应用，例如同时使用 HTTP 和 WebSockets，或者 HTTP 和微服务。

useGlobalFilters() 的限制

useGlobalFilters() 方法不自动为网关或混合应用中的非 HTTP 上下文设置过滤器。这意味着：

WebSockets 上下文: 如果你有一个 WebSocket 网关，useGlobalFilters() 不会自动捕获和处理 WebSocket 连接中的异常。

微服务上下文: 如果你使用 NestJS 的微服务功能，useGlobalFilters() 也不会自动处理微服务消息传递中的异常。

如何为网关和混合应用设置过滤器

如果你需要为网关或混合应用中的非 HTTP 上下文设置异常过滤器，你需要在相应的模块或网关中手动设置过滤器。例如：

```ts
import { WebSocketGateway, SubscribeMessage, MessageBody, WsException } from '@nestjs/websockets';
import { UseFilters } from '@nestjs/common';
import { WsExceptionFilter } from './ws-exception.filter';

@WebSocketGateway()
@UseFilters(new WsExceptionFilter()) // 为 WebSocket 网关设置异常过滤器
export class MyGateway {
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string): string {
    if (someConditionFails) {
      throw new WsException('Invalid message');
    }
    return data;
  }
}
```

@UseFilters() 装饰器: 用于在特定的控制器、网关或方法上设置异常过滤器。
WsExceptionFilter: 一个自定义的异常过滤器，用于处理 WebSocket 上下文中的异常。
通过这种方式，你可以确保在不同的上下文中，异常都能被正确捕获和处理。对于混合应用，你可能需要在不同的模块或组件中分别设置适当的过滤器，以覆盖所有可能的通信协议和上下文。


## 捕获一切

为了捕获每个未处理的异常（无论异常类型如何），请将 @Catch() 装饰器的参数列表留空，例如 @Catch()。

在下面的示例中，我们有一个与平台无关的代码，因为它使用 HTTP 适配器 来传递响应，并且不直接使用任何特定于平台的对象（Request 和 Response）：

```ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}

```


## 继承

通常，你将创建完全定制的异常过滤器来满足你的应用需求。但是，在某些用例中，你可能只想扩展内置的默认全局异常过滤器，并根据某些因素覆盖行为。

为了将异常处理委托给基本过滤器，你需要扩展 BaseExceptionFilter 并调用继承的 catch() 方法。
```ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
```

扩展 BaseExceptionFilter 的方法范围和控制器范围的过滤器不应使用 new 实例化。相反，让框架自动实例化它们。

全局过滤器可以扩展基本过滤器。这可以通过两种方式之一完成。

第一种方法是在实例化自定义全局过滤器时注入 HttpAdapter 引用：

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  await app.listen(3000);
}
bootstrap();
```

第二种方法是使用 APP_FILTER 令牌