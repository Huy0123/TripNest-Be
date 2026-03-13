import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private readonly reflector: Reflector) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    return next.handle().pipe(
      map((res) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const message =
          this.reflector.get<string>('message', context.getHandler()) || null;

        // Nếu res đã có trường data (thường là kết quả phân trang), ta spread nó ra
        if (res && typeof res === 'object' && 'data' in res) {
          return {
            success: true,
            statusCode,
            message,
            ...res,
          };
        }

        // Ngược lại, ta bọc kết quả vào trường data
        return {
          success: true,
          statusCode,
          message,
          data: res,
        };
      }),
    );
  }
}
