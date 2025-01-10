# Module
模块是用 @Module() 装饰器注释的类。@Module() 装饰器提供 Nest 用于组织应用结构的元数据。

每个应用至少有一个模块，即根模块。根模块是 Nest 用于构建应用图的起点 - Nest 用于解析模块和提供器关系及依赖的内部数据结构。虽然非常小的应用理论上可能只有根模块，但这不是典型的情况。我们要强调的是，强烈建议将模块作为组织组件的有效方式。因此，对于大多数应用来说，最终的架构将采用多个模块，每个模块封装一组密切相关的功能。

@Module() 装饰器采用单个对象，其属性描述模块：

providers	    将由 Nest 注入器实例化并且至少可以在该模块中共享的提供程序
controllers	    此模块中定义的必须实例化的控制器集
imports	        导出此模块所需的提供程序的导入模块列表
exports	        这个模块提供的 providers 的子集应该在导入这个模块的其他模块中可用。你可以使用提供器本身或仅使用其令牌（provide 值）

该模块默认封装了提供器。这意味着不可能注入既不直接属于当前模块也不从导入模块导出的提供程序。因此，你可以将模块中导出的提供程序视为模块的公共接口或 API。

## 功能模块
CatsController 和 CatsService 属于同一个应用域。由于它们密切相关，因此将它们移动到功能模块中是有意义的。特性模块只是简单地组织与特定特性相关的代码，保持代码的组织性并建立清晰的边界。

## 共享模块
在 Nest 中，默认情况下模块是单例，因此你可以轻松地在多个模块之间共享任何提供程序的同一实例。

## 模块重新导出

如上所示，模块可以导出其内部提供程序。此外，他们可以重新导出他们导入的模块。在下面的示例中，CommonModule 既被导入到 CoreModule 中，又被从 CoreModule 中导出，从而使其可用于导入该模块的其他模块。

```ts
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

## 依赖注入

模块类也可以注入提供程序（例如，出于配置目的）：

```ts
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {
  constructor(private catsService: CatsService) {}
}
```

但是，由于 循环依赖，模块类本身不能作为提供器注入。

## 全局模块

如果你必须在所有地方导入相同的模块集，它会变得乏味。与 Nest 不同，Angularproviders 是在全局作用域内注册的。一旦定义，它们随处可用。然而，Nest 将提供程序封装在模块作用域内。如果不首先导入封装模块，则无法在其他地方使用模块的提供程序。

当你想要提供一组开箱即用的提供程序（例如辅助程序、数据库连接等）时，请使用 @Global() 装饰器使模块全局化。

```ts
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

@Global() 装饰器使模块具有全局作用域。全局模块应该只注册一次，通常由根模块或核心模块注册。在上面的示例中，CatsService 提供程序将无处不在，希望注入服务的模块将不需要在其导入数组中导入 CatsModule。

## 动态模块
Nest 模块系统包含一个称为动态模块的强大功能。此功能使你能够轻松创建可自定义的模块，这些模块可以动态注册和配置提供程序。

```ts
import { Module, DynamicModule } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

forRoot() 方法可以同步或异步（即通过 Promise）返回动态模块。

该模块默认定义 Connection 提供器（在 @Module() 装饰器元数据中），但另外 - 取决于传递到 forRoot() 方法中的 entities 和 options 对象 - 公开提供器的集合，例如存储库。请注意，动态模块返回的属性扩展（而不是覆盖）@Module() 装饰器中定义的基本模块元数据。这就是从模块导出静态声明的 Connection 提供程序和动态生成的存储库提供程序的方式。

如果要在全局作用域内注册动态模块，请将 global 属性设置为 true。

{
  global: true,
  module: DatabaseModule,
  providers: providers,
  exports: providers,
}

DatabaseModule 可以通过以下方式导入和配置：

```ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
})
export class AppModule {}
```

如果你想反过来重新导出一个动态模块，你可以省略 exports 数组中的 forRoot() 方法调用：

```ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
  exports: [DatabaseModule],
})
export class AppModule {}
```