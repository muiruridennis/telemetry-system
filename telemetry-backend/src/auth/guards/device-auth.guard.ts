import { 
  Injectable, 
  ExecutionContext, 
  UnauthorizedException,
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class DeviceJwtGuard extends AuthGuard('device-jwt') {
  private readonly logger = new Logger(DeviceJwtGuard.name);

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Add custom logic here before authentication
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Device auth attempt: ${request.headers.authorization?.substring(0, 30)}...`);
    
    return super.canActivate(context);
  }

  handleRequest(err: any, device: any, info: any, context: ExecutionContext) {
    // Log authentication attempts
    const request = context.switchToHttp().getRequest();
    const deviceId = device?.deviceId || 'unknown';
    
    if (err || !device) {
      this.logger.warn(`Device auth failed: ${deviceId} - ${info?.message || err?.message}`);
      
      // Provide specific error messages
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Device token has expired. Please refresh your token.');
      }
      
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid device token format.');
      }
      
      if (!device) {
        throw new UnauthorizedException(
          'Device authentication required. Please provide a valid device token.'
        );
      }
      
      throw new UnauthorizedException(info?.message || 'Device authentication failed');
    }

    // Additional validation: Check if device is active
    if (!device.isActive) {
      this.logger.warn(`Inactive device attempted access: ${deviceId}`);
      throw new ForbiddenException(
        `Device ${deviceId} is not active. Please contact administrator.`
      );
    }

    this.logger.debug(`Device authenticated: ${deviceId}`);
    
    // Return device context with additional info
    return {
      ...device,
      isDevice: true,
      permissions: ['telemetry:send', 'telemetry:config:read'],
    };
  }
}