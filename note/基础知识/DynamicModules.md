# 动态模块

模块定义了像 providers 和 controllers 这样的组件组，它们组合在一起作为整个应用的模块化部分。它们为这些组件提供执行上下文或作用域。例如，模块中定义的提供程序对模块的其他成员可见，而无需导出它们。当提供器需要在模块外部可见时，它首先从其宿主模块中导出，然后导入到其消费模块中。

## 动态模块用例

通过静态模块绑定，使用模块没有机会影响主机模块中提供程序的配置方式。为什么这很重要？考虑我们有一个通用模块需要在不同用例中表现不同的情况。这类似于许多系统中的 "plugin" 概念，其中通用设施需要一些配置才能被消费者使用。

Nest 的一个很好的例子是配置模块。许多应用发现使用配置模块来外部化配置细节很有用。这使得动态更改不同部署中的应用设置变得容易：例如，开发者的开发数据库，登台/测试环境的登台数据库等。通过将配置参数的管理委托给配置模块，应用源代码保持独立于配置参数。

挑战在于配置模块本身，因为它是通用的（类似于 "plugin"），需要由其消费模块定制。这就是动态模块发挥作用的地方。使用动态模块功能，我们可以使配置模块动态化，以便使用模块可以使用 API 来控制配置模块在导入时的自定义方式。

换句话说，动态模块提供了一个 API，用于将一个模块导入另一个模块，并在导入时自定义该模块的属性和行为，而不是使用我们目前看到的静态绑定。

## 配置模块示例

我们的需求是让 ConfigModule 接受一个 options 对象来自定义。这是我们想要支持的功能。基本示例将 .env 文件的位置硬编码到项目根文件夹中。假设我们想让它可配置，这样你就可以在你选择的任何文件夹中管理你的 .env 文件。例如，假设你想将各种 .env 文件存储在项目根目录下名为 config 的文件夹中（即 src 的同级文件夹）。你希望在不同的项目中使用 ConfigModule 时能够选择不同的文件夹。

动态模块使我们能够将参数传递到被导入的模块中，这样我们就可以改变它的行为。让我们看看这是如何工作的。如果我们从消费模块的角度来看这看起来如何的最终目标开始，然后向后工作，这将很有帮助。首先，让我们快速回顾一下静态导入 ConfigModule 的示例（即，一种无法影响导入模块行为的方法）。密切注意 @Module() 装饰器中的 imports 数组：

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

让我们考虑一下我们传入配置对象的动态模块导入可能是什么样子。比较这两个示例之间 imports 数组的差异：

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

ConfigModule 是一个普通的类，所以我们可以推断它一定有一个名为 register() 的静态方法。我们知道它是静态的，因为我们是在 ConfigModule 类上调用它，而不是在该类的实例上调用它。注意：我们将很快创建的这个方法可以有任意名称，但按照惯例，我们应该将其称为 forRoot() 或 register()。

register() 方法由我们定义，因此我们可以接受任何我们喜欢的输入参数。在这种情况下，我们将接受一个具有合适属性的简单 options 对象，这是典型情况。

我们可以推断 register() 方法必须返回类似 module 的内容，因为它的返回值出现在我们熟悉的 imports 列表中，到目前为止我们已经看到该列表包含一个模块列表。

事实上，我们的 register() 方法将返回的是一个 DynamicModule。动态模块只不过是在运行时创建的模块，具有与静态模块完全相同的属性，外加一个名为 module 的附加属性。

动态模块必须返回一个具有完全相同接口的对象，外加一个名为 module 的附加属性。module 属性作为模块的名称，应与模块的类名相同。对于动态模块，模块选项对象的所有属性都是可选的，除了 module。

静态 register() 方法呢？我们现在可以看到它的工作是返回一个具有 DynamicModule 接口的对象。当我们调用它时，我们有效地向 imports 列表提供了一个模块，类似于我们在静态情况下通过列出模块类名来这样做的方式。换句话说，动态模块 API 只是返回一个模块，而不是固定 @Module 装饰器中的属性


我们现在可以声明 @Module() 装饰器的 imports 属性不仅可以采用模块类名（例如 imports: [UsersModule]），还可以采用返回动态模块的函数（例如 imports: [ConfigModule.register(...)]）。

动态模块本身可以导入其他模块。我们不会在这个例子中这样做，但如果动态模块依赖于其他模块的提供器，你将使用可选的 imports 属性导入它们。

```ts
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(): DynamicModule {
    return {
      module: ConfigModule,
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}
```

调用 ConfigModule.register(...) 返回一个 DynamicModule 对象，其属性与迄今为止我们通过 @Module() 装饰器作为元数据提供的属性基本相同。

## 模块配置

自定义 ConfigModule 行为的明显解决方案是在静态 register() 方法中向其传递一个 options 对象

## 社区准则

围绕某些 @nestjs/ 包使用 forRoot、register 和 forFeature 等方法，并且可能想知道所有这些方法的区别是什么。对此没有硬性规定，但 @nestjs/ 软件包会尽量遵循以下准则：

使用以下命令创建模块时：

register，你希望配置一个具有特定配置的动态模块，仅供调用模块使用。例如，使用 Nest 的 @nestjs/axios：HttpModule.register({ baseUrl: 'someUrl' })。如果在另一个模块中使用 HttpModule.register({ baseUrl: 'somewhere else' })，它将具有不同的配置。你可以根据需要对任意数量的模块执行此操作。

```ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.example.com',
    }),
  ],
})
export class FirstModule {}

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.another.com',
    }),
  ],
})
export class SecondModule {}
```

forRoot，你期望配置一个动态模块一次并在多个地方重用该配置（尽管可能在不知不觉中因为它被抽象掉了）。这就是为什么你有一个 GraphQLModule.forRoot()、一个 TypeOrmModule.forRoot() 等。
```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'test',
      password: 'test',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```


forFeature，你希望使用动态模块 forRoot 的配置，但需要修改一些特定于调用模块需求的配置（即该模块应该访问哪个存储库，或者日志器应该使用的上下文。）

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService],
})
export class UserModule {}
```

通常，所有这些都有对应的 async、registerAsync、forRootAsync 和 forFeatureAsync，意思相同，但也使用 Nest 的依赖注入进行配置。

## 可配置的模块构建器

由于手动创建公开 async 方法（registerAsync、forRootAsync 等）的高度可配置的动态模块非常复杂，特别是对于新手，Nest 公开了促进此过程的 ConfigurableModuleBuilder 类，并让你只需几行代码即可构建模块 "blueprint" 代码。

// TODO
## 后面的看不懂了，后续补充
