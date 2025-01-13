# Controller

控制器负责处理传入请求并向客户端返回响应。

控制器的目的是接收应用的特定请求。路由机制控制哪个控制器接收哪些请求。通常，每个控制器都有不止一条路由，不同的路由可以执行不同的操作。

为了创建基本控制器，我们使用类和装饰器。装饰器将类与所需的元数据相关联，并使 Nest 能够创建路由映射（将请求绑定到相应的控制器）。

为了快速创建内置 validation 的 CRUD 控制器，你可以使用 CLI 的 增删改查生成器：nest g resource [name]。

## 路由
在下面的示例中，我们将使用 @Controller() 装饰器，这是定义基本控制器所必需的。我们将指定 cats 的可选路由路径前缀。在 @Controller() 装饰器中使用路径前缀可以让我们轻松地对一组相关路由进行分组，并最大限度地减少重复代码。例如，我们可以选择将一组路由分组，这些路由管理与路由 /cats 下的猫实体的交互。在这种情况下，我们可以在 @Controller() 装饰器中指定路径前缀 cats，这样我们就不必为文件中的每个路由重复该部分路径。
```ts
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }
}
```
ps: 这里@Get()报错是因为没有tsconfig.json 应该在tsconfig.json中开启如下的配置

{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}

findAll() 方法之前的 @Get() HTTP 请求方法装饰器告诉 Nest 为 HTTP 请求的特定端点创建处理程序。端点对应于 HTTP 请求方法（在本例中为 GET）和路由路径。

处理程序的路由路径通过连接为控制器声明的（可选）前缀和方法装饰器中指定的任何路径来确定。由于我们已经为每个路由声明了一个前缀（cats），并且没有在装饰器中添加任何路径信息，Nest 会将 GET /cats 请求映射到这个处理程序。

路径包括可选的控制器路径前缀和请求方法装饰器中声明的任何路径字符串。例如，cats 的路径前缀与装饰器 @Get('breed') 的组合将为像 GET /cats/breed 这样的请求生成路由映射。

### 补充
ps:Nest 会检测处理程序何时使用 @Res() 或 @Next()，这表明你已选择特定于库的选项。如果同时使用两种方法，则该单一路由的标准方法将自动禁用，并且将不再按预期工作。要同时使用这两种方法（例如，通过注入响应对象来仅设置 cookies/headers，但仍将其余部分留给框架），你必须在 @Res({ passthrough: true }) 装饰器中将 passthrough 选项设置为 true。 这句话是什么意思有没有具体的例子进行解释说明

在 NestJS 中，@Res() 和 @Next() 装饰器用于直接访问底层的 HTTP 响应对象（例如 Express 的 response 对象）和中间件的 next 函数。这种做法通常用于需要特定于库的操作，比如设置特定的 HTTP 头或处理 cookies。

#### 解释

标准方法：NestJS 通常会自动处理请求和响应。你只需返回一个值，NestJS 会负责将其转换为 HTTP 响应。

使用 @Res()：当你使用 @Res() 装饰器时，你接管了响应的控制权。这意味着你需要手动发送响应（例如，调用 res.send()），否则请求将挂起，因为 NestJS 不再自动处理响应。

passthrough 选项：如果你想使用 @Res() 进行一些特定操作（如设置 cookies 或 headers），但仍希望 NestJS 自动处理响应的其余部分，你可以使用 @Res({ passthrough: true })。这允许你在不完全接管响应的情况下，进行一些自定义操作。

#### 示例

以下是一个使用 @Res({ passthrough: true }) 的示例：
```ts
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
```

@Res({ passthrough: true })：通过设置 passthrough: true，你可以在不完全接管响应的情况下，使用 res 对象来设置 cookies 和 headers。

自动处理响应：即使你使用了 @Res()，由于 passthrough 选项的存在，NestJS 仍会自动处理返回的数据 { message: 'Hello, World!' }，并将其发送给客户端。

自定义操作：在发送响应之前，你可以执行一些自定义操作，比如设置 cookies 或 headers，而不影响 NestJS 的默认行为。

## 请求对象

处理程序通常需要访问客户端请求的详细信息。Nest 提供对底层平台 请求对象 的访问（默认为 Express）。我们可以通过将 @Req() 装饰器添加到处理程序的签名来指示 Nest 注入它来访问请求对象。

请求对象表示 HTTP 请求，并具有请求查询字符串、参数、HTTP 标头和正文的属性。在大多数情况下，没有必要手动获取这些属性。我们可以使用开箱即用的专用装饰器，例如 @Body() 或 @Query()。

@Request(), @Req()	              req
@Response(), @Res().*	            res
@Next()	                          next
@Session()	                      req.session
@Param(key?: string)	            req.params / req.params[key]
@Body(key?: string)	              req.body / req.body[key]
@Query(key?: string)	            req.query / req.query[key]
@Headers(name?: string)	          req.headers / req.headers[name]
@Ip()	                            req.ip
@HostParam()	                    req.hosts

为了与底层 HTTP 平台（例如 Express 和 Fastify）之间的类型兼容，Nest 提供了 @Res() 和 @Response() 装饰器。@Res() 只是 @Response() 的别名。两者都直接暴露底层原生平台 response 对象接口。使用它们时，你还应该导入底层库（例如 @types/express）的类型以充分利用它们。请注意，当你在方法处理程序中注入 @Res() 或 @Response() 时，你会将 Nest 置于该处理程序的库特定模式，并且你将负责管理响应。这样做时，你必须通过调用 response 对象（例如，res.json(...) 或 res.send(...)）来触发某种响应，否则 HTTP 服务器将挂起。

## Resources
Nest 为所有标准的 HTTP 方法提供装饰器：@Get()、@Post()、@Put()、@Delete()、@Patch()、@Options() 和 @Head()。此外，@All() 定义了一个端点来处理所有这些。

```ts
import { Controller, All, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('universal')
export class UniversalController {
  @All()
  handleAllRequests(@Req() request: Request) {
    const method = request.method;
    return `This is a response to a ${method} request.`;
  }
}
// @All()：装饰器用于定义一个处理程序，该处理程序会响应 /universal 路径下的所有 HTTP 方法请求。
// @Req()：注入了请求对象（Request），可以用来获取请求的详细信息，例如请求方法、头信息、参数等。
```

## 路由通配符

也支持基于模式的路由。例如，星号用作通配符，将匹配任何字符组合。

```ts
@Get('ab*cd')
findAll() {
  return 'This route uses a wildcard';
}
```

'ab*cd' 路由路径将匹配 abcd、ab_cd、abecd 等。字符 ?、+、* 和 () 可以在路由路径中使用，并且是它们对应的正则表达式的子集。连字符 (-) 和点 (.) 由基于字符串的路径逐字解释。

仅 express 支持路由中间的通配符。

## 状态码
默认情况下响应状态代码始终为 200，POST 请求除外，该代码为 201。我们可以通过在处理程序级别添加 @HttpCode(...) 装饰器来轻松更改此行为。
通常，你的状态代码不是静态的，而是取决于各种因素。在这种情况下，你可以使用特定于库的响应（使用 @Res() 注入）对象（或者，如果发生错误，则抛出异常）。

## Header（标头）

要指定自定义响应标头，你可以使用 @Header() 装饰器或库特定的响应对象（并直接调用 res.header()）。

```ts
@Post()
@Header('Cache-Control', 'none')
create() {
  return 'This action adds a new cat';
}
```

## 重定向

要将响应重定向到特定 URL，你可以使用 @Redirect() 装饰器或库特定的响应对象（并直接调用 res.redirect()）。

@Redirect() 有两个参数，url 和 statusCode，两者都是可选的。如果省略，statusCode 的默认值为 302 (Found)。

```ts
@Get()
@Redirect('https://nest.nodejs.cn', 301)
```

有时你可能想要动态确定 HTTP 状态代码或重定向 URL。通过返回遵循 HttpRedirectResponse 接口（来自 @nestjs/common）的对象来完成此操作。

返回值将覆盖传递给 @Redirect() 装饰器的任何参数。例如：

```ts
@Get('docs')
@Redirect('https://nest.nodejs.cn', 302)
getDocs(@Query('version') version) {
  if (version && version === '5') {
    return { url: 'https://nest.nodejs.cn/v5/' };
  }
}
```

@Redirect('https://nest.nodejs.cn', 302)：

这个装饰器设置了默认的重定向行为。当访问 /docs 路径时，客户端将被重定向到 https://nest.nodejs.cn，并使用 HTTP 状态码 302。
302 状态码表示这是一个临时重定向，客户端在将来可能会继续使用原始 URL。

getDocs(@Query('version') version)：

这个方法处理 /docs 路径的请求。
@Query('version') 用于提取查询参数 version 的值。例如，如果请求 URL 是 /docs?version=5，那么 version 的值将是 '5'。

逻辑处理：

方法体内有一个条件判断：如果查询参数 version 存在且等于 '5'，则返回一个对象 { url: 'https://nest.nodejs.cn/v5/' }。
返回的对象会覆盖 @Redirect() 装饰器中指定的 URL。这意味着如果 version 是 '5'，客户端将被重定向到 https://nest.nodejs.cn/v5/，而不是默认的 https://nest.nodejs.cn。

## 路由参数
当你需要接受动态数据作为请求的一部分时（例如，GET /cats/1 获取 ID 为 1 的 cat），具有静态路径的路由将不起作用。为了定义带参数的路由，我们可以在路由的路径中添加路由参数标记，以捕获请求 URL 中该位置的动态值。下面 @Get() 装饰器示例中的路由参数令牌演示了这种用法。可以使用 @Param() 装饰器访问以这种方式声明的路由参数，应将其添加到方法签名中。

```ts
@Get(':id')
findOne(@Param() params: any): string {
  console.log(params.id);
  return `This action returns a #${params.id} cat`;
}
```

@Param() 用于修饰方法参数（上例中的 params），并使路由参数可用作方法体内该修饰方法参数的属性。如上面的代码所示，我们可以通过引用 params.id 来访问 id 参数。也可以传入一个特定的参数 token 给装饰器，然后在方法体中直接通过名称引用路由参数。

带参数的路由应在任何静态路径之后声明。这可以防止参数化路径拦截发往静态路径的流量。

假设你有以下两个路由：

/users/profile
/users/:id
如果你按照以下顺序定义路由：
```ts
// 参数化路径
app.get('/users/:id', (req, res) => {
  res.send(`User ID: ${req.params.id}`);
});

// 静态路径
app.get('/users/profile', (req, res) => {
  res.send('User Profile');
});
```
在这种情况下，请求 /users/profile 会被第一个路由 /users/:id 捕获，因为它会将 profile 视为一个动态参数 id 的值。

正确的顺序

为了避免这种情况，应该先定义静态路径，再定义参数化路径：
```ts
// 静态路径
app.get('/users/profile', (req, res) => {
  res.send('User Profile');
});

// 参数化路径
app.get('/users/:id', (req, res) => {
  res.send(`User ID: ${req.params.id}`);
});
```

## 子域路由

@Controller 装饰器可以采用 host 选项来要求传入请求的 HTTP 主机匹配某个特定值。

```ts
@Controller({ host: ':account.example.com' })
export class AccountController {
  @Get()
  getInfo(@HostParam('account') account: string) {
    return account;
  }
}

```

@Controller({ host: ':account.example.com' })：

这个装饰器定义了一个控制器，并指定了一个带有动态参数的主机名。
:account 是一个动态参数，类似于路由中的路径参数。它会匹配请求的子域部分。
例如，如果请求的主机名是 user123.example.com，那么 :account 的值将是 user123。

getInfo(@HostParam('account') account: string)：

@HostParam('account') 用于提取主机名中的动态参数 account。
这个参数的值将是请求中匹配 :account 的部分。
方法返回这个参数的值，因此如果请求的主机名是 user123.example.com，返回值将是 user123。

### 使用场景

多租户应用：这种模式非常适合多租户应用，每个租户都有自己的子域。例如，tenant1.example.com 和 tenant2.example.com 可以对应不同的租户。
个性化子域：允许用户使用个性化的子域访问应用，例如 username.example.com。

ps: 由于 Fastify 缺乏对嵌套路由的支持，因此在使用子域路由时，应使用（默认）Express 适配器。

与路由 path 类似，hosts 选项可以使用标记来捕获主机名中该位置的动态值。下面 @Controller() 装饰器示例中的主机参数令牌演示了这种用法。可以使用 @HostParam() 装饰器访问以这种方式声明的主机参数，应将其添加到方法签名中。

## 作用域

Nest 中几乎所有内容都是在传入请求之间共享的。我们有一个到数据库的连接池、具有全局状态的单例服务等。Node.js 不遵循请求/响应多线程无状态模型，在该模型中每个请求都由单独的线程处理。因此，使用单例实例对于我们的应用来说是完全安全的。

在 NestJS 中，默认情况下，大多数组件（如服务、控制器等）都是单例的。这意味着它们在应用程序的生命周期内只会被实例化一次，并在多个请求之间共享。这种设计与 Node.js 的单线程、事件驱动模型相匹配，因为 Node.js 不使用传统的多线程模型来处理每个请求。

## 异步性
每个异步函数都必须返回 Promise。这意味着你可以返回一个 Nest 能够自行解析的延迟值。
```ts
@Get()
async findAll(): Promise<any[]> {
  return [];
}
```

## 请求负载
我们之前的 POST 路由处理程序示例不接受任何客户端参数。让我们通过在此处添加 @Body() 装饰器来解决此问题。
但首先（如果你使用 TypeScript），我们需要确定 DTO（数据传输对象）架构。DTO 是定义数据如何通过网络发送的对象。我们可以通过使用 TypeScript 接口或简单的类来确定 DTO 模式。
