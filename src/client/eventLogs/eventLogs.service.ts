import events from 'events';
import { Request, Response } from 'express';

import EventLogs from './eventLogs.model';
import {
  getTenantSchemaName,
  getOriginalUrlAfterPrefix,
  getPageParams
} from '../../core/utils/recovoUtils';
import {
  LOG_ROUTE_EVENTS,
  MAP_EVENT_TO_USAGE_COLUMN,
  ROUTE_REVIEW_EMAIL,
  ROUTE_USER_EMAILS
} from '../common/constants/eventLogConfigs';
import logger from '../../core/utils/logger';
import Queue from '../common/utils/BufferedQueue';
import {
  FLUSH_RECOVVO_QUEUE,
  RECOVVO_LOG_EVENT,
  RECOVVO_QUEUE_EVENT_LOGS
} from '../common/constants/bufferedQueueConstants';
import { queueUsageReport } from '../usageReport/usageReport.service';
import { queueSearchReport } from '../searchReport/searchReport.service';

interface IUsageMap {
  [key: number]: any;
}

export const eventEmitter = new events.EventEmitter();

const queue = new Queue(RECOVVO_QUEUE_EVENT_LOGS, {
  size: 10,
  flushTimeout: 2000
});

const eventLog = 'eventLog';
const eventParams = 'eventParams';
const primarySearch = 'primarySearch';
const searchLog = 'searchReportLog';
const CHECK_ONLY_PAGE_NUMBER = 1;

eventEmitter.on(RECOVVO_LOG_EVENT, (req: Request, res: Response) => {
  Object.keys(LOG_ROUTE_EVENTS).forEach((route) => {
    const { eventName, method, logParams, meta } = LOG_ROUTE_EVENTS[route];
    if (
      checkIfRouteMatch(route, getOriginalUrlAfterPrefix(req.originalUrl)) &&
      !!method.find((item) => item.toLowerCase() === req.method.toLowerCase())
    ) {
      const userId = res.locals.loggedInPayload.userId;
      const userRole = res.locals.loggedInPayload.role;
      const tenantName = getTenantSchemaName(req.baseUrl);
      const pageParams = getPageParams(req.query);
      const contactParams = res.locals.contact;
      const clientEmailDomainParams = res.locals.clientEmailDomain;
      const eventProperties = (logParams || []).reduce((acc: any, paramKey) => {
        acc[paramKey] = req.query[paramKey] || '';
        return acc;
      }, {});

      // proceed only for the first page, e.g.
      // scrolling might resend request for the same page
      // and same parameters, we only log unique requests for the search
      if (pageParams && pageParams['page'] === CHECK_ONLY_PAGE_NUMBER) {
        if (meta) {
          if (meta.requestRoute === ROUTE_USER_EMAILS) {
            if (contactParams) {
              eventProperties[primarySearch] = contactParams.email;
            } else {
              eventProperties[primarySearch] = '';
            }
            // pushing contact as primary search for ROUTE_USER_EMAIL
            // these parameters are not provided via request parameter
            // e.g. res.locals.contact is fetched via middleware in api
            // so manually appending them to the list
            if (logParams) {
              logParams.push(primarySearch);
            }
          } else if (meta.requestRoute === ROUTE_REVIEW_EMAIL) {
            if (clientEmailDomainParams) {
              eventProperties[primarySearch] = clientEmailDomainParams;
            } else {
              eventProperties[primarySearch] = '';
            }
            if (logParams) {
              logParams.push(primarySearch);
            }
          }
        }

        queue.add({
          eventName: req.method.toLowerCase() + '_' + eventName,
          eventProperties: {
            ...eventProperties,
            currentDate: new Date().toISOString()
          },
          userProperties: {
            role: userRole
          },
          loggedBy: userId,
          tenantName,
          meta,
          logParams,
          pageParams,
          contactParams
        });
      }
    }
  });
});

queue.on(FLUSH_RECOVVO_QUEUE, function (data: any) {
  logger.log('info', 'EventLog::Added item to master queue');
  const insertable = data.reduce((acc: any, item: any) => {
    const {
      tenantName,
      eventName,
      userProperties,
      loggedBy,
      eventProperties,
      meta,
      logParams
    } = item;
    if (!acc[tenantName]) {
      acc[tenantName] = {};
    }
    if (!acc[tenantName][eventLog]) {
      acc[tenantName][eventLog] = [];
    }

    acc[tenantName][eventLog].push({
      event_name: eventName,
      event_properties: eventProperties,
      user_properties: userProperties,
      logged_by: loggedBy
    });

    if (!acc[tenantName][eventParams]) {
      acc[tenantName][eventParams] = {};
    }

    if (!acc[tenantName][searchLog]) {
      acc[tenantName][searchLog] = [];
    }

    const searches: { [key: string]: string } = {};
    logParams.forEach((logParam: string) => {
      searches[logParam] = eventProperties[logParam];
    });

    acc[tenantName][searchLog].push({
      ...searches,
      updatedAt: eventProperties['currentDate'],
      loggedBy,
      searched: meta['event']
    });

    return acc;
  }, {});

  Object.keys(insertable).forEach((tenantName) => {
    EventLogs.create(tenantName, insertable[tenantName][eventLog]).then(
      (res: any) => {
        //Calculate usage stats from latest log events;
        const usageByUser = res.reduce((acc: IUsageMap, item: any) => {
          const { loggedBy, eventName, eventProperties } = item;

          if (!acc[loggedBy]) {
            acc[loggedBy] = {
              logged_by: loggedBy,
              event_triggered_date: eventProperties.currentDate.slice(0, 10)
            };
          }
          if (MAP_EVENT_TO_USAGE_COLUMN[eventName]) {
            if (!acc[loggedBy][MAP_EVENT_TO_USAGE_COLUMN[eventName]]) {
              acc[loggedBy][MAP_EVENT_TO_USAGE_COLUMN[eventName]] = 0;
            }
            acc[loggedBy][MAP_EVENT_TO_USAGE_COLUMN[eventName]]++;

            if (MAP_EVENT_TO_USAGE_COLUMN[eventName] === 'searches') {
              acc[loggedBy][MAP_EVENT_TO_USAGE_COLUMN.last_search] =
                eventProperties.currentDate;
            }
          }

          acc[loggedBy][MAP_EVENT_TO_USAGE_COLUMN.updated_at] =
            eventProperties.currentDate;

          return acc;
        }, {});

        queueUsageReport.add({ tenantName, usageByUser });
      }
    );

    queueSearchReport.add({
      tenantName,
      searchByUser: insertable[tenantName][searchLog]
    });
  });
});

const checkIfRouteMatch = (route: string, url: string) => {
  const template = route.replace(/:\w+/g, `([^/]+)`);

  const regex = new RegExp(`^${template}$`);
  const matches = url.match(regex);

  return !!matches;
};
