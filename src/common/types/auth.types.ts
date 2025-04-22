import { DEVICE_OS, OSID } from './../constants/auth.constants';

export type DEVICE_OS_TYPE = (typeof DEVICE_OS)[keyof typeof DEVICE_OS];
export type OSID_TYPE = (typeof OSID)[keyof typeof OSID];
