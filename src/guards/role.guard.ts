import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/decorators/role.decorator';
import { UserRole } from 'src/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (user.roles && Array.isArray(user.roles)) {
      return requiredRoles.some((role) => user.roles.includes(role));
    }
    if (user.role && typeof user.role === 'string') {
      return requiredRoles.includes(user.role as UserRole);
    }
    return false;
  }
}

