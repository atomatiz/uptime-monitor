import { PERMISSIONS, ROLES } from '@common/constants/role.constants';

export type ROLE = (typeof ROLES)[keyof typeof ROLES];
export type PERMISSION = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
