import { HOST_EVENT_NAMES } from '../constants/event.constants';
import { HOST_TYPES } from '../constants/host.constants';

export type HOST_EVENT_NAME =
    (typeof HOST_EVENT_NAMES)[keyof typeof HOST_EVENT_NAMES];

export type HOST_TYPE = (typeof HOST_TYPES)[keyof typeof HOST_TYPES];
