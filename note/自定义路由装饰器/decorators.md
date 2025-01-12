# 自定义路由装饰器

Nest 是围绕一种称为装饰器的语言功能构建的。

## 参数构造器

Nest 提供了一组有用的参数装饰器，你可以将它们与 HTTP 路由处理程序一起使用。下面是提供的装饰器和它们代表的普通 Express（或 Fastify）对象的列表

@Request(), @Req()	                req
@Response(), @Res()	                res
@Next()	                            next
@Session()                      	req.session
@Param(param?: string)          	req.params / req.params[param]
@Body(param?: string)           	req.body / req.body[param]
@Query(param?: string)	            req.query / req.query[param]
@Headers(param?: string)        	req.headers / req.headers[param]
@Ip()	                            req.ip
@HostParam()	                    req.hosts

## 使用管道

Nest 以与内置装饰器（@Body()、@Param() 和 @Query()）相同的方式处理自定义参数装饰器。这意味着管道也会针对自定义注释参数执行（在我们的示例中，user 参数）。此外，你可以将管道直接应用于自定义装饰器：

```ts
@Get()
async findOne(
  @User(new ValidationPipe({ validateCustomDecorators: true }))
  user: UserEntity,
) {
  console.log(user);
}
```


请注意，validateCustomDecorators 选项必须设置为 true。默认情况下，ValidationPipe 不验证使用自定义装饰器注释的参数。