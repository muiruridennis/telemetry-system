import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DeviceAuthGuard extends AuthGuard('device-jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, device: any) {
    if (err || !device) {
      throw err || new Error('Device authentication failed');
    }
    return device;
  }
}