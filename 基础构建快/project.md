# 用nest project 来介绍nestjs

```bash
$ npm i -g @nestjs/cli
$ nest new project-name

```

将创建 project-name 目录，安装 node 模块和一些其他样板文件，将创建 src/ 目录并填充几个核心文件。

src
|--app.controller.spec.ts
|--app.controller.ts
|--app.module.ts
|--app.service.ts
|--main.ts

以下是这些核心文件的简要概述：

app.controller.ts	具有单一路由的基本控制器。
app.controller.spec.ts	控制器的单元测试。
app.module.ts	应用的根模块。
app.service.ts	具有单一方法的基本服务。
main.ts	使用核心函数 NestFactory 创建 Nest 应用实例的应用入口文件。

main.ts 包含一个异步函数，它将引导我们的应用：

```typescript
main.ts 

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

要创建 Nest 应用实例，我们使用核心 NestFactory 类。NestFactory 公开了一些允许创建应用实例的静态方法。create() 方法返回一个应用对象，它实现了 INestApplication 接口。该对象提供了一组方法.在上面的 main.ts 示例中，我们只是启动了 HTTP 监听器，它让应用等待入站 HTTP 请求。

使用 Nest CLI 搭建的项目会创建一个初始项目结构，鼓励开发者遵循将每个模块保存在自己的专用目录中的惯例。

# 平台

Nest 旨在成为一个与平台无关的框架。平台独立性使得创建可重用的逻辑部分成为可能，开发者可以在多种不同类型的应用中利用这些逻辑部分。从技术上讲，一旦创建了适配器，Nest 就可以与任何 Node HTTP 框架一起工作。开箱即用地支持两个 HTTP 平台：express 和 fastify。你可以选择最适合你需要的一种。

platform-express：Express 是一个著名的 Node.js 极简 Web 框架。这是一个经过实战检验、可用于生产的库，其中包含社区实现的大量资源。默认使用 @nestjs/platform-express 包。许多用户使用 Express 得到了很好的服务，不需要采取任何操作来启用它。

platform-fastify：Fastify 是一个高性能和低开销的框架，高度专注于提供最大的效率和速度。

无论使用哪个平台，它都会公开自己的应用接口。这些分别被视为 NestExpressApplication 和 NestFastifyApplication。

当你将类型传递给 NestFactory.create() 方法时，如下例所示，app 对象将具有专用于该特定平台的方法。但请注意，除非你确实想要访问底层平台 API，否则不需要指定类型。

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

# 运行

安装过程完成后，你可以在操作系统命令提示符下运行以下命令以启动应用监听入站 HTTP 请求：

```bash
$ npm run start
```

ps:为了加快开发过程（构建速度加快 20 倍），你可以通过将 -b swc 标志传递给 start 脚本来使用 SWC 构建器，如下所示 npm run start -- -b swc。

此命令启动应用，HTTP 服务器监听 src/main.ts 文件中定义的端口。应用运行后，打开浏览器并导航至 http://localhost:3000/。你应该会看到 Hello World! 消息。

要监视文件中的更改，你可以运行以下命令来启动应用：

```bash
$ npm run start:dev
```

此命令将监视你的文件，自动重新编译并重新加载服务器。


# 语法检查和格式化

命令行尽最大努力构建可靠的大规模开发工作流程。因此，生成的 Nest 项目预装了代码 linter 和格式化程序（分别为 eslint 和 prettier）。

为了确保最大的稳定性和可扩展性，我们使用基础 eslint 和 prettier cli 软件包。此设置允许 IDE 在设计上与官方扩展完美集成。

对于 IDE 不相关的无头环境（持续集成、Git 钩子等），Nest 项目附带了即用型 npm 脚本。

```bash
# Lint and autofix with eslint
$ npm run lint

# Format with prettier
$ npm run format
```