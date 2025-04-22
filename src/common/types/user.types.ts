import {
    COUNTRY_CODES,
    COUNTRY_NAMES,
    GENDERS,
} from '@common/constants/user.constants';

export type GENDER = (typeof GENDERS)[keyof typeof GENDERS];
export type COUNTRY_NAME = (typeof COUNTRY_NAMES)[keyof typeof COUNTRY_NAMES];
export type COUNTRY_CODE = (typeof COUNTRY_CODES)[keyof typeof COUNTRY_CODES];
