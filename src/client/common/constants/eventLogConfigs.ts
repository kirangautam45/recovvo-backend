export enum EventDefinition {
  CONTACT_PRIMARY_SEARCH = 'Contacts',
  DOCUMENT_SECONDARY_SEARCH = 'Documents',
  CONTACT_EMAIL_SECONDARY_SEARCH = 'Contact Emails',
  EMAIL_REVIEW = 'User Email Review',
  CONTACT_EXPORT = 'Export contacts',
  ATTACHMENT_EXPORT = 'Export attachments'
}

export enum LogType {
  SEARCH = 'LOG_SEARCH_RECORDS',
  USAGE = 'LOG_USAGE_RECORDS'
}

interface IUsageProps {
  eventName: string;
  method: Array<string>;
  logParams?: Array<string>;
  meta?: {
    event: EventDefinition;
    requestRoute: string;
    logType: Array<LogType>;
  };
}

interface ITrackRouteUsage {
  [key: string]: IUsageProps;
}

interface IMapEventToFormatted {
  [key: string]: string;
}

export const ROUTE_CONTACTS = '/contacts';
export const ROUTE_CONTACT_DOCUMENTS = '/message-parts/attachments';
export const ROUTE_USER_EMAILS = '/contacts/:id/emails';
export const ROUTE_CONTACT_EXPORT = '/contacts/download-csv';
export const ROUTE_ATTACHMENT_EXPORT = '/message-parts/:id/presigned-url';
export const ROUTE_REVIEW_EMAIL = '/emails/:id/activities';

export const LOG_ROUTE_EVENTS: ITrackRouteUsage = {
  [ROUTE_REVIEW_EMAIL]: {
    eventName: 'emails_reviewed',
    method: ['post'],
    logParams: [], //no request parameter in api endpoint
    meta: {
      event: EventDefinition.EMAIL_REVIEW,
      requestRoute: ROUTE_REVIEW_EMAIL,
      logType: [LogType.USAGE]
    }
  },
  [ROUTE_CONTACTS]: {
    eventName: 'search',
    method: ['post'],
    logParams: ['primarySearch'],
    meta: {
      event: EventDefinition.CONTACT_PRIMARY_SEARCH,
      requestRoute: ROUTE_CONTACTS,
      logType: [LogType.SEARCH, LogType.USAGE]
    }
  },
  [ROUTE_CONTACT_DOCUMENTS]: {
    eventName: 'search',
    method: ['post'],
    logParams: ['primarySearch', 'secondarySearch'],
    meta: {
      event: EventDefinition.DOCUMENT_SECONDARY_SEARCH,
      requestRoute: ROUTE_CONTACT_DOCUMENTS,
      logType: [LogType.SEARCH, LogType.USAGE]
    }
  },
  [ROUTE_USER_EMAILS]: {
    eventName: 'search',
    method: ['get'],
    logParams: ['secondarySearch'],
    meta: {
      event: EventDefinition.CONTACT_EMAIL_SECONDARY_SEARCH,
      requestRoute: ROUTE_USER_EMAILS,
      logType: [LogType.SEARCH, LogType.USAGE]
    }
  },
  [ROUTE_CONTACT_EXPORT]: {
    eventName: 'contact_exports',
    method: ['get'],
    logParams: ['primarySearch'],
    meta: {
      event: EventDefinition.CONTACT_EXPORT,
      requestRoute: ROUTE_CONTACT_EXPORT,
      logType: [LogType.USAGE]
    }
  },
  [ROUTE_ATTACHMENT_EXPORT]: {
    eventName: 'attachment_exports',
    method: ['get'],
    logParams: ['primarySearch', 'secondarySearch'],
    meta: {
      event: EventDefinition.EMAIL_REVIEW,
      requestRoute: ROUTE_ATTACHMENT_EXPORT,
      logType: [LogType.USAGE]
    }
  }
};

export const MAP_EVENT_TO_USAGE_COLUMN: IMapEventToFormatted = {
  post_search: 'searches',
  last_search: 'last_search',
  updated_at: 'updated_at',
  get_contact_exports: 'contact_exports',
  get_attachment_exports: 'attachment_exports',
  post_emails_reviewed: 'emails_reviewed'
};
