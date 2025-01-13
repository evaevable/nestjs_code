# 自定义提供器

## DI 基础知识

依赖注入是一种 控制反转 (IoC) 技术，其中你将依赖的实例化委托给 IoC 容器（在我们的例子中是 NestJS 运行时系统），而不是在你自己的代码中强制执行。

依赖注入的工作原理

注册提供者: 提供者必须在模块的 providers 数组中注册，以便 NestJS 知道如何创建和管理它的实例。

注入提供者: 一旦提供者在模块中注册，NestJS 就可以在控制器或其他提供者中通过构造函数注入它。

未注册的提供者: 如果 CatsService 没有在 providers 中注册，CatsController 在尝试注入 CatsService 时将会抛出一个错误，因为 NestJS 无法找到 CatsService 的实例。

## 自定义

当你的要求超出标准提供商提供的要求时会发生什么？这里有一些例子：

你想要创建一个自定义实例而不是让 Nest 实例化（或返回一个类的缓存实例）

你想在第二个依赖中重用现有的类

你想用模拟版本覆盖一个类以进行测试

Nest 允许你定义自定义提供程序来处理这些情况。它提供了几种定义自定义提供程序的方法。让我们来看看它们。

如果你遇到依赖解析问题，你可以设置 NEST_DEBUG 环境变量并在启动期间获取额外的依赖解析日志。

### 值提供器 useValue

useValue 语法对于注入常量值、将外部库放入 Nest 容器或用模拟对象替换真实实现非常有用。

```ts
import { CatsService } from './cats.service';

const mockCatsService = {
  /* mock implementation
  ...
  */
};

@Module({
  imports: [CatsModule],
  providers: [
    {
      provide: CatsService,
      useValue: mockCatsService,
    },
  ],
})
export class AppModule {}
```

在此示例中，CatsService 令牌将解析为 mockCatsService 模拟对象。useValue 需要一个值 - 在本例中，是一个与其要替换的 CatsService 类具有相同接口的字面量对象。

### 非基于类的提供器令牌

我们已经使用类名作为我们的提供器标记（providers 数组中列出的提供器中的 provide 属性的值）。这与 基于构造函数的注入 使用的标准模式相匹配，其中标记也是一个类名。但有时，我们可能希望灵活地使用字符串或符号作为 DI 令牌。例如：

```ts
import { connection } from './connection';

@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useValue: connection,
    },
  ],
})
export class AppModule {}
```

### 类提供器 useClass

useClass 语法允许你动态确定令牌应解析为的类。

```ts
const configServiceProvider = {
  provide: ConfigService,
  useClass:
    process.env.NODE_ENV === 'development'
      ? DevelopmentConfigService
      : ProductionConfigService,
};

@Module({
  providers: [configServiceProvider],
})
export class AppModule {}
```

### 工厂提供器 useFactory

useFactory 语法允许动态创建提供程序。实际提供器将由工厂函数返回的值提供。工厂功能可以根据需要简单或复杂。一个简单的工厂可能不依赖于任何其他提供器。更复杂的工厂本身可以注入计算结果所需的其他提供器。对于后一种情况，工厂提供器语法有一对相关的机制：

工厂函数可以接受（可选）参数。

（可选的）inject 属性接受一组提供器，Nest 将在实例化过程中解析这些提供器并将其作为参数传递给工厂函数。此外，这些提供程序可以标记为可选。这两个列表应该是相关的：Nest 将以相同的顺序将 inject 列表中的实例作为参数传递给工厂函数。

```ts
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider, optionalProvider?: string) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \_____________/            \__________________/
  //        This provider              The provider with this
  //        is mandatory.              token can resolve to `undefined`.
};

@Module({
  providers: [
    connectionProvider,
    OptionsProvider,
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
```

### 别名提供器 useExisting

useExisting 语法允许你为现有提供程序创建别名。这创建了两种访问同一提供程序的方法。

```ts
@Injectable()
class LoggerService {
  /* implementation details */
}

const loggerAliasProvider = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};

@Module({
  providers: [LoggerService, loggerAliasProvider],
})
export class AppModule {}
```

### 非基于服务的提供商

虽然提供器经常提供服务，但他们并不限于这种用途。提供器可以提供任何值。

```ts
const configFactory = {
  provide: 'CONFIG',
  useFactory: () => {
    return process.env.NODE_ENV === 'development' ? devConfig : prodConfig;
  },
};

@Module({
  providers: [configFactory],
})
export class AppModule {}

```

## 导出定制提供器

与任何提供器一样，自定义提供器的作用域仅限于其声明模块。要使其对其他模块可见，必须将其导出。要导出自定义提供程序，我们可以使用其令牌或完整的提供程序对象。



