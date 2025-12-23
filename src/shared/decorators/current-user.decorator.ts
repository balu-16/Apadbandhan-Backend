import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * CurrentUser Decorator (Small Issue #20)
 * 
 * Custom decorator to extract the current user from the request.
 * Use this instead of @Request() req and accessing req.user.
 * 
 * Usage:
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: JwtPayload) {
 *   return this.userService.findOne(user.userId);
 * }
 */
export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        // If a specific property is requested, return just that property
        if (data) {
            return user?.[data];
        }

        return user;
    },
);

/**
 * JWT Payload interface for type safety with CurrentUser decorator
 */
export interface JwtPayload {
    userId: string;
    phone: string;
    role: 'user' | 'admin' | 'superadmin';
}
