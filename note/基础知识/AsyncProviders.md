# 异步提供器

有时，应用启动应延迟，直到完成一项或多项异步任务。例如，你可能不想在与数据库建立连接之前开始接受请求。你可以使用异步提供程序实现此目的。

其语法是将 async/await 与 useFactory 语法一起使用。工厂返回一个 Promise，工厂函数可以 await 异步任务。在实例化任何依赖（注入）此类提供器的类之前，Nest 将等待 promise 的解决。

```ts
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection(options);
    return connection;
  },
}
```

## 注入

与任何其他提供程序一样，异步提供程序通过其令牌注入其他组件。在上面的示例中，你将使用构造 @Inject('ASYNC_CONNECTION')。

