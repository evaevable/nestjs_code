# 测试

自动化测试被认为是任何认真的软件开发工作的重要组成部分。自动化使得在开发过程中快速轻松地重复单个测试或测试套件变得容易。这有助于确保发布符合质量和性能目标。自动化有助于提高覆盖率并为开发者提供更快的反馈循环。自动化既可以提高单个开发者的工作效率，又可以确保测试在关键的开发生命周期节点运行，例如源代码控制签入、功能集成和版本发布。

此类测试通常跨越多种类型，包括单元测试、端到端 (e2e) 测试、集成测试等。虽然好处是毋庸置疑的，但设置它们可能很乏味。Nest 致力于推广开发最佳实践，包括有效的测试，因此它包括以下功能，以帮助开发者和团队构建和自动化测试。Nest：

自动搭建组件的默认单元测试和应用的端到端测试

提供默认工具（例如构建隔离模块/应用加载器的测试运行器）

开箱即用地提供与 Jest 和 Supertest 的集成，同时保持对测试工具的无关性

使 Nest 依赖注入系统在测试环境中可用，以便轻松模拟组件

如前所述，你可以使用你喜欢的任何测试框架，因为 Nest 不强制使用任何特定工具。只需替换所需的元素（例如测试运行器），你仍然可以享受 Nest 现成测试工具的好处。


## 单元测试

在下面的例子中，我们测试了两个类：CatsController 和 CatsService。如前所述，Jest 是作为默认测试框架提供的。它充当测试运行器，还提供断言函数和测试替身实用程序。在下面的基本测试中，我们手动实例化这些类，并确保控制器和服务履行其 API 合同。

```ts
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

Test 类可用于提供一个应用执行上下文，该上下文实质上模拟了完整的 Nest 运行时，但为你提供了钩子，使你可以轻松管理类实例，包括模拟和覆盖。Test 类有一个 createTestingModule() 方法，该方法将模块元数据对象作为其参数（传递给 @Module() 装饰器的同一对象）。此方法返回一个 TestingModule 实例，该实例又提供了一些方法。对于单元测试，重要的是 compile() 方法。此方法引导模块及其依赖（类似于使用 NestFactory.create() 在常规 main.ts 文件中引导应用的方式），并返回准备好进行测试的模块。

compile() 方法是异步的，因此必须等待。编译模块后，你可以使用 get() 方法检索它声明的任何静态实例（控制器和提供程序）。

TestingModule 继承自 模块参考 类，因此它具有动态解析作用域providers的能力。使用 resolve() 方法执行此操作（get() 方法只能检索静态实例）。

## 自动模拟

Nest 还允许你定义一个模拟工厂以应用于所有缺失的依赖。这对于类中有大量依赖并且模拟所有依赖将花费很长时间和大量设置的情况很有用。要使用此功能，需要将 createTestingModule() 与 useMocker() 方法链接起来，为你的依赖模拟传递一个工厂。这个工厂可以接受一个可选的令牌，它是一个实例令牌，任何对 Nest 提供器有效的令牌，并返回一个模拟实现。下面是使用 jest-mock 创建通用模拟器和使用 jest.fn() 为 CatsService 创建特定模拟器的示例。

```ts
// ...
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('CatsController', () => {
  let controller: CatsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CatsController],
    })
      .useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === CatsService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(CatsController);
  });
});
```

REQUEST 和 INQUIRER 提供程序无法自动模拟，因为它们已在上下文中预定义。但是，可以使用自定义提供程序语法或使用 .overrideProvider 方法覆盖它们。

## 端到端测试

与侧重于单个模块和类的单元测试不同，端到端 (e2e) 测试涵盖类和模块在更聚合级别上的交互 - 更接近终端用户与产品之间的交互类型 系统。随着应用的增长，手动测试每个 API 端点的端到端行为变得越来越困难。自动化的端到端测试帮助我们确保系统的整体行为正确并满足项目要求。为了执行 e2e 测试，我们使用与我们刚刚在单元测试中介绍的配置类似的配置。此外，Nest 还可以轻松使用 Supertest 库来模拟 HTTP 请求。

## TODO 后面的需要我慢慢理解








## 总结

describe: Jest 的一个全局函数，用于定义一个测试套件。它通常用于将相关的测试用例分组。describe 块用于将多个相关的测试用例（it 块）组织在一起。每个 it 块代表一个单独的测试用例，通常用于测试一个特定的功能或行为。

it: Jest 的另一个全局函数，用于定义一个单独的测试用例。它通常用于描述一个具体的测试场景。

beforeEach: Jest 提供的一个钩子函数，在每个测试用例执行之前运行。它通常用于设置测试环境或初始化变量。

expect: Jest 提供的断言函数，用于检查测试结果是否符合预期。

jest.fn() 是 Jest 提供的一个用于创建模拟函数（mock function）的工具。模拟函数在测试中非常有用，因为它们允许你替代实际的函数实现，从而控制函数的行为并监控函数的调用情况。
替代真实实现: 在测试中，你可能不希望调用真实的函数实现，尤其是当这些函数涉及到外部依赖（如网络请求、数据库操作）时。使用 jest.fn() 可以创建一个没有实际实现的函数。
监控函数调用: 你可以使用模拟函数来检查函数是否被调用、调用了多少次、传递了哪些参数等。
自定义返回值: 你可以为模拟函数设置返回值或实现，以便在测试中使用。