import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Observable } from 'rxjs';

@Injectable()
export class Authguard implements CanActivate{
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp();
        return validateRequest(request);
    }
}

function validateRequest(request: HttpArgumentsHost): any {
    if (request){
        return true;
    }
    return false;
}