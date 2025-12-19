import { 
  Injectable, 
  CanActivate, 
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException 
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../enums/role.enum";
import { Roles_key } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(Roles_key, [
            context.getHandler(),
            context.getClass(),
        ]);
        
        if (!requiredRoles) {
            return true;
        }
        
        const { user } = context.switchToHttp().getRequest();
        
        // Check if user is authenticated
        if (!user) {
            throw new UnauthorizedException('Please log in to access this resource');
        }
        
        // Check if user has required role
        const hasRole = requiredRoles.some((role) => user.role === role);
        
        if (!hasRole) {
            const controllerName = this.getControllerName(context);
            const action = this.getActionDescription(context.getHandler().name);
            
            throw new ForbiddenException(
                `Access denied. ${action} requires ${this.formatRoles(requiredRoles)} role. ` +
                `Your role is: ${user.role}`
            );
        }
        
        return true;
    }
    
    private getControllerName(context: ExecutionContext): string {
        const className = context.getClass().name;
        return className.replace('Controller', '').toLowerCase();
    }
    
    private getActionDescription(methodName: string): string {
        const actionMap: Record<string, string> = {
            'create': 'Creating resources',
            'register': 'Registering resources',
            'update': 'Updating resources',
            'delete': 'Deleting resources',
            'remove': 'Removing resources',
            'findAll': 'Viewing all resources',
            'findOne': 'Viewing resource details',
            'getProfile': 'Accessing profile',
            'updateProfile': 'Updating profile',
        };
        
        return actionMap[methodName] || 'This action';
    }
    
    private formatRoles(roles: Role[]): string {
        if (roles.length === 1) return roles[0];
        if (roles.length === 2) return `${roles[0]} or ${roles[1]}`;
        return `${roles.slice(0, -1).join(', ')} or ${roles[roles.length - 1]}`;
    }
}