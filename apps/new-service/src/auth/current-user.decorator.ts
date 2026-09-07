import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'

import type { AuthenticatedUser } from '../common/types'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser | null => {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>()
    return request.user ?? null
  },
)
