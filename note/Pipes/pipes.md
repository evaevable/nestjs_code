# Pipes

管道是用 @Injectable() 装饰器注释的类，它实现了 PipeTransform 接口。

管道有两个典型的用例：

转型：将输入数据转换为所需的形式（例如，从字符串到整数）

验证：评估输入数据，如果有效，只需将其原样传递；否则抛出异常

在这两种情况下，管道都在由 控制器路由处理器 处理的 arguments 上运行。Nest 在调用方法之前插入一个管道，管道接收指定给该方法的参数并对它们进行操作。任何转换或验证操作都会在此时发生，之后会使用任何（可能）转换的参数调用路由处理程序。

Nest 附带了许多内置管道，你可以开箱即用。你还可以构建自己的自定义管道。

管道在例外区域内运行。这意味着当 Pipe 抛出异常时，它由异常层处理（全局异常过滤器和应用于当前上下文的任何 异常过滤器）。综上所述，应该很清楚，当在 Pipe 中抛出异常时，随后不会执行任何控制器方法。这为你提供了一种最佳实践技术，用于在系统边界验证从外部源进入应用的数据。

## 内置管道

Nest 附带九个开箱即用的管道：

ValidationPipe

ParseIntPipe

ParseFloatPipe

ParseBoolPipe

ParseArrayPipe

ParseUUIDPipe

ParseEnumPipe

DefaultValuePipe

ParseFilePipe

它们是从 @nestjs/common 包中导出的。


## 绑定管道

要使用管道，我们需要将管道类的实例绑定到适当的上下文。在我们的 ParseIntPipe 示例中，我们希望将管道与特定的路由处理程序方法相关联，并确保它在调用该方法之前运行。我们使用以下构造来实现这一点，我们将其称为在方法参数级别绑定管道：

```ts
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

这确保以下两个条件之一为真：我们在 findOne() 方法中收到的参数是一个数字（正如我们对 this.catsService.findOne() 的调用所预期的那样），或者在调用路由处理程序之前抛出异常。

例如，假设路由被称为：


GET localhost:3000/abc
Nest 会抛出这样的异常：


{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}

该异常将阻止 findOne() 方法的主体执行。

在上面的示例中，我们传递了一个类 (ParseIntPipe)，而不是一个实例，将实例化的责任留给了框架并启用依赖注入。与管道和守卫一样，我们可以传递一个就地实例。如果我们想通过传递选项来自定义内置管道的行为，那么传递就地实例很有用：

```ts
@Get(':id')
async findOne(
  @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
  id: number,
) {
  return this.catsService.findOne(id);
}
```

绑定其他转换管道（所有 Parse* 管道）的工作原理类似。这些管道都在验证路由参数、查询字符串参数和请求正文值的上下文中工作。

例如，使用查询字符串参数：

```ts
@Get()
async findOne(@Query('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

下面是使用 ParseUUIDPipe 解析字符串参数并验证它是否为 UUID 的示例。

```ts
@Get(':uuid')
async findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
  return this.catsService.findOne(uuid);
}
```

## 定制管道

你可以构建自己的自定义管道。虽然 Nest 提供了强大的内置 ParseIntPipe 和 ValidationPipe，但让我们从头开始构建每个的简单自定义版本，以了解如何构建自定义管道。

我们从一个简单的 ValidationPipe 开始。最初，我们让它简单地接受一个输入值并立即返回相同的值，表现得像一个恒等函数。

```ts
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform{
    transform(value: any, metadata: ArgumentMetadata) {
        return value;
    }
}
```

PipeTransform<T, R> 是一个通用接口，任何管道都必须实现。泛型接口用 T 表示输入 value 的类型，用 R 表示 transform() 方法的返回类型。
每个管道都必须实现 transform() 方法来履行 PipeTransform 接口契约。这个方法有两个参数：

value

metadata

value 参数是当前处理的方法参数（在被路由处理方法接收之前），metadata 是当前处理的方法参数的元数据。元数据对象具有以下属性：

```ts
export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Type<unknown>;
  data?: string;
}
```

这些属性描述了当前处理的参数。

type	    指示参数是主体 @Body()、查询 @Query()、参数 @Param() 还是自定义参数。
metatype	提供参数的元类型，例如 String。注意：如果你在路由处理程序方法签名中省略类型声明或使用普通 JavaScript，则该值为 undefined。
data	    传递给装饰器的字符串，例如 @Body('string')。如果将装饰器括号留空，则为 undefined。



TypeScript 接口在转译过程中消失。因此，如果方法参数的类型声明为接口而不是类，则 metatype 值将为 Object。

## 基于模式的验证

让我们的验证管道更有用一些。仔细查看 CatsController 的 create() 方法，我们可能希望在尝试运行我们的服务方法之前确保帖子正文对象有效。


```ts
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}


export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

我们要确保对 create 方法的任何传入请求都包含有效的正文。所以我们要验证 createCatDto 对象的三个成员。我们可以在路由处理程序方法内执行此操作，但这样做并不理想，因为它会破坏单一职责原则 (SRP)。

另一种方法可能是创建一个验证器类并在那里委派任务。这样做的缺点是我们必须记住在每个方法的开头调用此验证器。

如何创建验证中间件？这可能有效，但不幸的是，不可能创建可在整个应用的所有上下文中使用的通用中间件。这是因为中间件不知道执行上下文，包括将被调用的处理程序及其任何参数。


## 对象模式验证

有几种方法可用于以干净的 DRY 方式进行对象验证。一种常见的方法是使用基于模式的验证。让我们继续尝试这种方法。

Zod 库允许你使用可读的 API 以直接的方式创建模式。让我们构建一个使用基于 Zod 的模式的验证管道。

首先安装所需的包：

$ npm install --save zod

在下面的代码示例中，我们创建了一个将模式作为 constructor 参数的简单类。然后我们应用 schema.parse() 方法，该方法根据提供的模式验证我们的传入参数。

如前所述，验证管道要么返回不变的值，要么引发异常。

```ts
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema  } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}
```

## 绑定验证管道

绑定验证管道也非常简单。

在这种情况下，我们希望在方法调用级别绑定管道。在我们当前的示例中，我们需要执行以下操作才能使用 ZodValidationPipe：

创建 ZodValidationPipe 的实例

在管道的类构造函数中传递上下文特定的 Zod 架构

将管道绑定到方法

```ts
import { z } from 'zod';

export const createCatSchema = z
  .object({
    name: z.string(),
    age: z.number(),
    breed: z.string(),
  })
  .required();

export type CreateCatDto = z.infer<typeof createCatSchema>;
```

我们使用 @UsePipes() 装饰器来做到这一点，如下所示：
```ts
@Post()
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

## 类验证器

Nest 与 class-validator 库配合良好。这个强大的库允许你使用基于装饰器的验证。基于装饰器的验证非常强大，特别是与 Nest 的 Pipe 功能结合使用时，因为我们可以访问已处理属性的 metatype。在我们开始之前，我们需要安装所需的包：


$ npm i --save class-validator class-transformer


一旦安装了这些，我们就可以向 CreateCatDto 类添加一些装饰器。在这里，我们看到了这种技术的一个显着优势：CreateCatDto 类仍然是我们的 Post 主体对象的唯一真实来源（而不是必须创建一个单独的验证类）。


```ts
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  breed: string;
}
```

使用上述注释的Validate:

```ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

让我们看一下这段代码。首先，注意 transform() 方法被标记为 async。这是可能的，因为 Nest 支持同步和异步管道。我们将此方法设为 async，因为某些类验证器验证 可以是异步的（利用 Promises）。

接下来请注意，我们正在使用解构将元类型字段（仅从 ArgumentMetadata 中提取此成员）提取到我们的 metatype 参数中。这只是获取完整 ArgumentMetadata 的简写，然后有一个附加语句来分配元类型变量。

接下来，注意辅助函数 toValidate()。当正在处理的当前参数是原生 JavaScript 类型时，它负责绕过验证步骤（它们不能附加验证装饰器，因此没有理由让它们通过验证步骤）。

接下来，我们使用类转换器函数 plainToInstance() 将我们的纯 JavaScript 参数对象转换为类型化对象，以便我们可以应用验证。我们必须这样做的原因是，当从网络请求反序列化时，传入的 post body 对象没有任何类型信息（这是底层平台（例如 Express）的工作方式）。类验证器需要使用我们之前为 DTO 定义的验证装饰器，因此我们需要执行此转换以将传入主体视为经过适当装饰的对象，而不仅仅是普通对象。

最后，如前所述，由于这是一个验证管道，它要么返回不变的值，要么引发异常。

最后一步是绑定 ValidationPipe。管道可以是参数作用域的、方法作用域的、控制器作用域的或全局作用域的。之前，通过基于 Zod 的验证管道，我们看到了在方法级别绑定管道的示例。

```ts
@Post()
async create(
  @Body(new ValidationPipe()) createCatDto: CreateCatDto,
) {
  this.catsService.create(createCatDto);
}
```

当验证逻辑只涉及一个指定参数时，参数作用域的管道很有用。


## 全局作用域管道

由于 ValidationPipe 被创建为尽可能通用，因此我们可以通过将其设置为全局作用域的管道来实现其完整实用性，以便将其应用于整个应用中的每个路由处理程序。

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

全局管道用于整个应用，用于每个控制器和每个路由处理程序。

请注意，就依赖注入而言，从任何模块外部注册的全局管道（如上例中的 useGlobalPipes()）无法注入依赖，因为绑定是在任何模块的上下文之外完成的。为了解决这个问题，你可以使用以下结构直接从任何模块设置全局管道：

```ts

import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

## 内置ValidationPipe

提醒一下，你不必自己构建通用验证管道，因为 ValidationPipe 由 Nest 开箱即用。内置的 ValidationPipe 提供了比我们在本章中构建的示例更多的选项，为了说明定制管道的机制，它一直保持基本。


## 转换用例

验证不是自定义管道的唯一用例。在本章开头，我们提到管道还可以将输入数据转换为所需的格式。这是可能的，因为从 transform 函数返回的值完全覆盖了参数的先前值。

这什么时候有用？考虑到有时候从客户端传过来的数据需要进行一些改变 - 例如将字符串转换为整数 - 在它可以被路由处理程序方法正确处理之前。此外，一些必需的数据字段可能会丢失，我们希望应用默认值。转换管道可以通过在客户端请求和请求处理程序之间插入处理函数来执行这些功能。

这是一个简单的 ParseIntPipe，它负责将字符串解析为整数值。（如上所述，Nest 有一个更复杂的内置 ParseIntPipe；我们将其作为自定义转换管道的简单示例）。

```ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

## 提供默认值

Parse* 管道需要定义参数值。他们在收到 null 或 undefined 值时抛出异常。为了允许端点处理丢失的查询字符串参数值，我们必须提供一个默认值，以便在 Parse* 管道对这些值进行操作之前注入。DefaultValuePipe 就是为这个目的服务的。只需在相关的 Parse* 管道之前的 @Query() 装饰器中实例化一个 DefaultValuePipe，如下所示：


```ts
@Get()
async findAll(
  @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly: boolean,
  @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
) {
  return this.catsService.findAll({ activeOnly, page });
}
```