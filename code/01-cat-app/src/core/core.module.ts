import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TransformInterceptor } from "./interceptors/transform.interceptor";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";


@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor},
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor},
  ],
})

/*
通过 { provide: APP_INTERCEPTOR, useClass: TransformInterceptor } 和 { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }，你将 TransformInterceptor 和 LoggingInterceptor 注册为全局拦截器。
APP_INTERCEPTOR 是一个特殊的令牌，用于标识全局拦截器。
*/
export class CoreModule {}