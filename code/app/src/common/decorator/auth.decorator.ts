// import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
// import { Authguard } from '../guard/auth.guard';
// import { RolesGuard } from '../guard/roles.guard';

// export function Auth(...roles: Role[]) {
//   return applyDecorators(
//     SetMetadata('roles', roles),
//     UseGuards(Authguard, RolesGuard),
//     ApiBearerAuth(),
//     ApiUnauthorizedResponse({ description: 'Unauthorized' }),
//   );
// }
