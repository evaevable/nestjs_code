# Interceptors 拦截器

拦截器是用 @Injectable() 装饰器注释并实现 NestInterceptor 接口的类。

拦截器具有一组有用的功能，这些功能的灵感来自 面向方面编程 (AOP) 技术。它们可以：

在方法执行之前/之后绑定额外的逻辑

转换函数返回的结果

转换函数抛出的异常

扩展基本功能行为

根据特定条件完全覆盖函数（例如，出于缓存目的）

## 基本

每个拦截器都实现了 intercept() 方法，它有两个参数。第一个是 ExecutionContext 实例（与 guards 完全相同的对象）。ExecutionContext 继承自 ArgumentsHost。我们之前在异常过滤器章节中看到了 ArgumentsHost。在那里，我们看到它是已传递给原始处理程序的参数的封装器，并且包含基于应用类型的不同参数数组。

## 执行上下文

通过扩展 ArgumentsHost，ExecutionContext 还添加了几个新的辅助方法，这些方法提供有关当前执行过程的更多详细信息。这些细节有助于构建更通用的拦截器，这些拦截器可以在广泛的控制器、方法和执行上下文中工作。

## 调用处理程序

第二个参数是 CallHandler。CallHandler 接口实现了 handle() 方法，你可以使用它在拦截器中的某个点调用路由处理程序方法。如果在 intercept() 方法的实现中不调用 handle() 方法，则根本不会执行路由处理程序方法。

这种方法意味着 intercept() 方法有效地封装了请求/响应流。因此，你可以在最终路由处理程序执行之前和之后实现自定义逻辑。很明显，你可以在 intercept() 方法中编写在调用 handle() 之前执行的代码，但是如何影响之后发生的情况呢？因为 handle() 方法返回一个 Observable，我们可以使用强大的 RxJS 操作符来进一步操作响应。使用面向方面的编程术语，路由处理程序的调用（即调用 handle()）称为 切入点，表示它是我们附加逻辑的插入点。

例如，考虑传入的 POST /cats 请求。此请求发往 CatsController 内部定义的 create() 处理程序。如果在任何地方调用了一个不调用 handle() 方法的拦截器，则不会执行 create() 方法。一旦 handle() 被调用（并且其 Observable 已被返回），create() 处理程序将被触发。一旦通过 Observable 接收到响应流，就可以对该流执行其他操作，并将最终结果返回给调用者。


## 切面拦截

我们要看的第一个用例是使用拦截器记录用户交互（例如，存储用户调用、异步调度事件或计算时间戳）。我们在下面展示一个简单的 LoggingInterceptor：

```ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`After... ${Date.now() - now}ms`)),
      );
  }
}

```

NestInterceptor<T, R> 是一个通用接口，其中 T 表示 Observable<T>（支持响应流）的类型，R 是 Observable<R> 封装的值的类型。

拦截器，如控制器、提供器、守卫等，可以通过它们的 constructor 注入依赖。

由于 handle() 返回一个 RxJS Observable，我们可以使用多种运算符来操纵流。在上面的示例中，我们使用了 tap() 运算符，它在可观察流正常或异常终止时调用我们的匿名日志记录函数，但不会以其他方式干扰响应周期。

## 绑定拦截器

为了设置拦截器，我们使用从 @nestjs/common 包中导入的 @UseInterceptors() 装饰器。与 pipes 和 guards 一样，拦截器可以是控制器作用域的、方法作用域的或全局作用域的。


## 响应映射

我们已经知道 handle() 返回 Observable。该流包含从路由处理程序返回的值，因此我们可以使用 RxJS 的 map() 运算符轻松地改变它。


创建 TransformInterceptor，它将以简单的方式修改每个响应以演示该过程。它将使用 RxJS 的 map() 运算符将响应对象分配给新创建对象的 data 属性，将新对象返回给客户端。

```ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map(data => ({ data })));
  }
}
```

## 异常映射

利用 RxJS 的 catchError() 运算符来覆盖抛出的异常：


## 流覆盖

有几个原因导致我们有时可能想要完全阻止调用处理程序并返回一个不同的值。一个明显的例子是实现缓存以提高响应时间。让我们看一下一个简单的缓存拦截器，它从缓存返回其响应。在一个现实的例子中，我们想要考虑其他因素，如 TTL、缓存失效、缓存大小等，但这超出了本次讨论的作用域。在这里，我们将提供一个演示主要概念的基本示例。

```ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return next.handle();
  }
}
```

我们的 CacheInterceptor 有一个硬编码的 isCached 变量和一个硬编码的响应 []。需要注意的关键点是，我们在这里返回一个由 RxJS of() 运算符创建的新流，因此根本不会调用路由处理程序。当有人调用使用 CacheInterceptor 的端点时，将立即返回响应（硬编码的空数组）。为了创建通用解决方案，你可以利用 Reflector 并创建自定义装饰器。
