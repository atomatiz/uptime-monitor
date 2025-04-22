export const ROLES = {
    SUPER_ADMINISTRATOR: 'super-admin',
    ADMINISTRATOR: 'admin',
    MODERATOR: 'moderator',
    AUDITOR: 'auditor',
    USER: 'user',
} as const;

export const PERMISSIONS = {
    READ: 'read',
    READ_OWN: 'readOwn',
    READ_ANY: 'readAny',
    CREATE: 'create',
    CREATE_OWN: 'createOwn',
    CREATE_ANY: 'createAny',
    UPDATE: 'update',
    UPDATE_OWN: 'updateOwn',
    UPDATE_ANY: 'updateAny',
    DELETE: 'delete',
    DELETE_OWN: 'deleteOwn',
    DELETE_ANY: 'deleteAny',
} as const;
