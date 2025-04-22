import { DATABASE_TYPES } from '@common/constants/database.constants';

export type DATABASE_TYPE =
    (typeof DATABASE_TYPES)[keyof typeof DATABASE_TYPES];
