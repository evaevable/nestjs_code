# 注入作用域

## provider scope

DEFAULT	    提供程序的单个实例在整个应用中共享。实例生命周期与应用生命周期直接相关。应用启动后，所有单例提供程序都已实例化。默认情况下使用单例作用域。
REQUEST	    专门为每个传入的请求创建一个新的提供程序实例。请求完成处理后，该实例将被垃圾回收。
TRANSIENT	临时提供器不在消费者之间共享。每个注入临时提供器的消费者都将收到一个新的专用实例。

## 用法
通过将 scope 属性传递给 @Injectable() 装饰器选项对象来指定注入作用域

@Injectable({ scope: Scope.REQUEST })

对于 定制提供器，以long-hand形式设置 scope 属性以进行提供商注册：

{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}

默认使用单例范围，无需声明。如果你确实想将提供程序声明为单例作用域，请为 scope 属性使用 Scope.DEFAULT 值。

## Controller scope

控制器也可以有作用域，它适用于在该控制器中声明的所有请求方法处理程序。与提供器作用域一样，控制器的作用域声明了它的生命周期。对于请求作用域的控制器，为每个入站请求创建一个新实例，并在请求完成处理后进行垃圾收集。

@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}

## 作用域层次结构

REQUEST 示波器在注入链中冒泡。依赖于request作用域提供程序的控制器本身将是request作用域的。

想象一下以下依赖图：CatsController <- CatsService <- CatsRepository。如果 CatsService 是Request作用域的（其他都是默认的单例），CatsController 将成为request作用域的，因为它依赖于注入的服务。不依赖的 CatsRepository 将保持单例作用域。

TRANSIENT作用域的依赖不遵循该模式。如果单例作用域的 DogsService 注入TRANSIENT LoggerService 提供程序，它将收到它的一个新实例。但是，DogsService 将保持单例作用域，因此将它注入任何地方都不会解析为 DogsService 的新实例。如果这是所需的行为，DogsService 也必须明确标记为 TRANSIENT。


## Request provider

在基于 HTTP 服务器的应用中（例如，使用 @nestjs/platform-express 或 @nestjs/platform-fastify），你可能希望在使用请求作用域提供程序时访问对原始请求对象的引用。你可以通过注入 REQUEST 对象来完成此操作。

REQUEST 提供程序是请求范围的，因此在这种情况下你不需要显式使用 REQUEST 范围。

```ts
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

## Inquirer provider

如果你想获取构建提供器的类，例如在日志记录或指标提供器中，你可以注入 INQUIRER 令牌。

```ts
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parentClass: object) {}

  sayHello(message: string) {
    console.log(`${this.parentClass?.constructor?.name}: ${message}`);
  }
}
```

## 性能

使用Request作用域的提供程序将对应用性能产生影响。虽然 Nest 尝试缓存尽可能多的元数据，但它仍然必须在每个Request上创建你的类的实例。因此，它会减慢你的平均响应时间和整体基准测试结果。


## Durable providers

Request-scoped provider可能会导致延迟增加，因为至少有 1 个Request-scoped provider（注入到控制器实例中，或更深层 - 注入到其provider之一）使控制器也为Request-scoped。这意味着必须根据每个单独的Request重新创建（实例化）它（然后进行垃圾收集）。现在，这也意味着，假设有 30k 个并行Request，将有 30k 个控制器（及其Request-scoped provider）的临时实例。

要将常规提供器转变为持久提供器，只需将 durable 标志设置为 true 并将其作用域更改为 Scope.REQUEST（如果 REQUEST 作用域已经在注入链中则不需要）：


@Injectable({ scope: Scope.REQUEST, durable: true })
export class CatsService {}

对于 定制提供器，以长手形式设置 durable 属性以进行提供商注册：


{
  provide: 'foobar',
  useFactory: () => { ... },
  scope: Scope.REQUEST,
  durable: true,
}