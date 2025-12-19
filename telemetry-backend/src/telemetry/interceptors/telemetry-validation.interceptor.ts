import { 
    Injectable, 
    NestInterceptor, 
    ExecutionContext, 
    CallHandler,
    BadRequestException,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  
  @Injectable()
  export class TelemetryValidationInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      const body = request.body;
      
      // Additional validation for telemetry data
      if (body?.data) {
        body.data.forEach((telemetry: any, index: number) => {
          if (!telemetry.metrics || Object.keys(telemetry.metrics).length === 0) {
            throw new BadRequestException(
              `Telemetry record at index ${index} must contain metrics`
            );
          }
          
          // Validate timestamp is not in the future
          const timestamp = new Date(telemetry.timestamp);
          const now = new Date();
          if (timestamp > now) {
            throw new BadRequestException(
              `Telemetry timestamp at index ${index} cannot be in the future`
            );
          }
        });
      }
      
      return next.handle();
    }
  }