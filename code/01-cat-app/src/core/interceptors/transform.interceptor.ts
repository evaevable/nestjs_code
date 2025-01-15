import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';

export class Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Response<T>> | Promise<Observable<Response<T>>> {
      return next.handle().pipe(map(data => ({ data })));
  }
}
