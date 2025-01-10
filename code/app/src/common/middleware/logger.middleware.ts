import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    use(req: any, res: any, next: (error?: Error | any) => void) {
        console.log("request....");
        next();
    }
}

export function logger(req: Request, res: Response, next: NextFunction) {
    console.log(`Request...`);
    next();
};