import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { catchError, Observable, throwError } from "rxjs";

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
      return next
        .handle()
        .pipe(
          catchError(err =>
            throwError(
              () => new HttpException('New message', HttpStatus.BAD_GATEWAY),
            )
          )
        );
  }
}