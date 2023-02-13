import axios from 'axios';

import logger from '../../../core/utils/logger';
import config from '../../../core/config/config';
import * as mailService from '../../user/ses.service';
import { generateETLTriggerMessageTemplate } from '../../../core/utils/email-template';

/**
 * Start the ETL process
 */
export async function startInitialFetch(
  schema: string,
  organizationSlug: string
) {
  logger.info('Start the initial fetch for organization with slug', {
    organizationSlug
  });

  const { emailSubject, emailMessage } = generateETLTriggerMessageTemplate(
    schema,
    organizationSlug
  );

  const developerEmail = <string>config.mail.developerEmail;

  return await mailService.sendMessage(
    String(developerEmail),
    emailSubject,
    emailMessage
  );
}

/**
 * Get the status of the task
 */
export async function findTaskStatus(taskId: number) {
  logger.info('Get the status of the task with id', taskId);
  const url = `${process.env.ETL_ENDPOINT}/task/${taskId}`;

  try {
    const response = await axios.get(url);

    return response.data;
  } catch (err) {
    return {
      data: {
        code: err.response.status,
        message: err.response.statusText
      }
    };
  }
}
