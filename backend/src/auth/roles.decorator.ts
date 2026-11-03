import { SetMetadata } from '@nestjs/common';
import { Profile } from '../generated/prisma/enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Profile[]) => SetMetadata(ROLES_KEY, roles);
