# Service
提供器是 Nest 中的一个基本概念。许多基本的 Nest 类可以被视为提供器 - 服务、存储库、工厂、助手等等。提供器的主要思想是它可以作为依赖注入；这意味着对象之间可以创建各种关系，并且 "接线" 这些对象的功能很大程度上可以委托给 Nest 运行时系统。

## 依赖注入
Nest 是围绕通常称为依赖注入的强大设计模式构建的。
在 Nest 中，由于 TypeScript 的功能，管理依赖非常容易，因为它们只是按类型解析。在下面的示例中，Nest 将通过创建并返回 CatsService 的实例来解析 catsService（或者，在单例的正常情况下，如果已在其他地方请求过，则返回现有实例）。此依赖已解析并传递给控制器的构造函数（或分配给指示的属性）：

constructor(private catsService: CatsService) {}

## 作用域

提供程序通常具有与应用生命周期同步的生命周期 ("scope")。启动应用时，必须解析每个依赖，因此必须实例化每个提供程序。同样，当应用关闭时，每个提供器都将被销毁。但是，也有一些方法可以使你的提供程序生命周期限定在请求范围内。

## 自定义提供器

Nest 有一个内置的控制反转 ("IoC") 容器，可以解决提供器之间的关系。此功能是上述依赖注入功能的基础，但实际上比我们目前所描述的功能强大得多。有几种定义提供器的方法：你可以使用普通值、类以及异步或同步工厂。

## 可选提供器

有时，你可能有不一定要解决的依赖。例如，你的类可能依赖于配置对象，但如果没有传递任何内容，则应使用默认值。在这种情况下，依赖变为可选，因为缺少配置提供程序不会导致错误。

要指示提供器是可选的，请在构造函数的签名中使用 @Optional() 装饰器。

```ts
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

@Injectable() 是一个装饰器，用于标记一个类可以被 NestJS 的依赖注入系统管理。这意味着这个类可以被注入到其他类中，或者它可以注入其他的依赖。

@Optional(): 这个装饰器表示 httpClient 是一个可选的依赖。如果没有提供这个依赖，NestJS 不会抛出错误，而是将 httpClient 设置为 undefined。

@Inject('HTTP_OPTIONS'): 这个装饰器用于显式地指定要注入的依赖。'HTTP_OPTIONS' 是一个标识符，用于告诉 NestJS 在依赖注入时应该使用哪个提供者。

## 属性的注入
到目前为止，我们使用的技术称为基于构造函数的注入，因为提供器是通过构造函数方法注入的。在某些非常特殊的情况下，基于属性的注入可能很有用。例如，如果你的顶层类依赖于一个或多个提供器，则通过从构造函数在子类中调用 super() 将它们一路向上传递可能会非常乏味。为了避免这种情况，可以在属性级别使用 @Inject() 装饰器。

```ts
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```

ps: 如果你的类没有扩展另一个类，那么你应该始终更喜欢使用基于构造函数的注入。构造函数明确概述了所需的依赖，并提供比使用 @Inject 注释的类属性更好的可见性。

## 提供器注册（service 注册）

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```