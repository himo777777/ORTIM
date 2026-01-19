import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Call parent canActivate but don't require it to pass
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any) {
    // Don't throw on error - just return null user
    return user || null;
  }
}
