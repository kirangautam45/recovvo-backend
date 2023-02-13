import aws from 'aws-sdk';

import logger from '../../core/utils/logger';
import config from '../../core/config/config';

const email = <string>config.mail.senderEmail;

aws.config.update(config.aws);

if (config.environment === 'development') {
  aws.config.update(config.awsLocalConfig);
}

const ses = new aws.SES();

export function sendMessage(
  destinationEmail: string,
  emailSubject: string,
  emailMessage: string,
  ccAddress?: string
) {
  const ccAddresses = ccAddress ? [ccAddress] : [];

  const params = {
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: emailMessage
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: emailSubject
      }
    },
    Destination: {
      CcAddresses: ccAddresses,
      ToAddresses: [destinationEmail]
    },
    Source: email
  };
  logger.log('info', 'Sending email to -', {
    destinationEmail
  });
  return ses.sendEmail(params).promise();
}
