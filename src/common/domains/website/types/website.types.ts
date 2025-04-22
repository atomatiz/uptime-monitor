import { WEBSITE_EVENT_NAMES } from '../constants/event.constants';

export type WEBSITE_EVENT_NAME =
    (typeof WEBSITE_EVENT_NAMES)[keyof typeof WEBSITE_EVENT_NAMES];
