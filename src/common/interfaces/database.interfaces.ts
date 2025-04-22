import { DATABASE_TYPE } from '@common/types/database.types';

export interface DatabaseOptions {
    types: DATABASE_TYPE[];
    global?: boolean;
}
