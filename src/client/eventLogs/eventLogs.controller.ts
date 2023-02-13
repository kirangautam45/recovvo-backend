import { Request, Response, NextFunction } from 'express';

import logger from '../../core/utils/logger';
import { eventEmitter } from './eventLogs.service';
import { RECOVVO_LOG_EVENT } from '../../client/common/constants/bufferedQueueConstants';

export async function logEvents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    logger.log('info', 'EventLog::Logging user event.');
    eventEmitter.emit(RECOVVO_LOG_EVENT, req, res);
  } catch (err) {
    //Skipping Error
  }
  next();
}
