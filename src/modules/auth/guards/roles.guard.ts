import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user from database to check their role
    const user = await this.usersService.findOne(userId);
    
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const userRole = user.role || 'user';

    // Check if user has required role
    // Superadmin can access everything
    // Admin can access admin and user routes
    // User can only access user routes
    const roleHierarchy: Record<Role, number> = {
      'superadmin': 3,
      'admin': 2,
      'user': 1,
    };

    const userRoleLevel = roleHierarchy[userRole];
    const hasAccess = requiredRoles.some(role => userRoleLevel >= roleHierarchy[role]);

    if (!hasAccess) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Attach user role to request for later use
    request.user.role = userRole;

    return true;
  }
}
