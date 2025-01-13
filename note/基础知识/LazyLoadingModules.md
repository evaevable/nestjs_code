# 延迟加载模块

默认情况下，模块是预先加载的，这意味着一旦应用加载，所有模块也会加载，无论它们是否立即需要。虽然这对于大多数应用来说没问题，但它可能会成为在无服务器环境中运行的应用/工作进程的瓶颈，其中启动延迟 ("冷启动") 至关重要。

延迟加载可以通过仅加载特定无服务器函数调用所需的模块来帮助减少引导时间。此外，你还可以在无服务器功能为 "warm" 时异步加载其他模块，以进一步加快后续调用的引导时间（延迟模块注册）。

为了按需加载模块，Nest 提供了 LazyModuleLoader 类，可以以正常方式注入到类中：

@Injectable()
export class CatsService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}
}


或者，你可以从应用引导程序文件 (main.ts) 中获取对 LazyModuleLoader 提供程序的引用，如下所示：

// "app" represents a Nest application instance
const lazyModuleLoader = app.get(LazyModuleLoader);

有了这个，你现在可以使用以下结构加载任何模块：

const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);


"延迟加载" 模块在第一次 LazyModuleLoader#load 方法调用时被缓存。这意味着，每次连续尝试加载 LazyModule 将非常快，并且将返回缓存的实例，而不是再次加载模块。

## 延迟加载控制器、网关和解析器

由于 Nest 中的控制器（或 GraphQL 应用中的解析器）表示路由/路径/主题（或查询/修改）集，因此你无法使用 LazyModuleLoader 类延迟加载它们。


