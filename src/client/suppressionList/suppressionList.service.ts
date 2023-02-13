import * as _ from 'lodash';
import * as HttpStatus from 'http-status-codes';

import * as userDao from '../user/user.dao';
import errorMessage from './suppressionList.errors';
import { csvHeaders } from './validators/csv.validator';
import { ACTIVE, INACTIVE } from './suppressionList.constants';
import NotFoundError from '../../core/exceptions/NotFoundError';
import ISuppressedUser from './interfaces/suppressedUser.interface';
import { constructUserNotFound } from '../../core/utils/errorMessage';
import {
  buildCSVUserUploadResponse,
  buildUserUploadResponse
} from '../../core/utils/buildJSONResponse';

/**
 * Remove suppressed user.
 *
 * @param id number
 */
export async function removeUserSuppression(
  schema: string,
  id: number
): Promise<void> {
  const user = await userDao.findOne(schema, {
    id,
    isDeleted: false,
    isSuppressed: true
  });
  if (!user) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }
  if (user.isSuppressed) {
    await userDao.updateById(schema, id, { isSuppressed: false });
  }
  return;
}

/**
 * Remove user suppression list.
 *
 */
export async function removeUserSuppressionList(schema: string): Promise<void> {
  await userDao.update(schema, {}, { isSuppressed: false });
  return;
}

/* Get Suppression status.
 *
 */
export async function getSuppressionStatus(schema: string): Promise<string> {
  const suppressedUser = await userDao.find(schema, {
    isSuppressed: true,
    isDeleted: false
  });
  if (!suppressedUser) {
    throw new NotFoundError(errorMessage.UserNotFound);
  }
  if (suppressedUser.length > 0) {
    return ACTIVE;
  }
  return INACTIVE;
}

/**
 * Processes CSV file
 *
 * @param results object
 */
export async function processSuppressionCSV(
  schema: string,
  results: { [key: string]: string }[]
) {
  await userDao.update(schema, {}, { isSuppressed: false });
  const emails = _.map(results, csvHeaders.emailAddress);
  const emailAddresses = emails.map((email) => email.toLowerCase());

  const users = await userDao.findByEmailWhereIn(
    schema,
    { isDeleted: false },
    emailAddresses
  );
  const userEmails = _.map(users, 'email');
  await userDao.updateByEmailWhereIn(schema, userEmails, {
    isSuppressed: true
  });

  return emailAddresses.map((email, index) => {
    if (!userEmails.includes(email)) {
      return buildCSVUserUploadResponse(
        index + 2,
        email,
        HttpStatus.BAD_REQUEST,
        constructUserNotFound(email)
      );
    }

    return buildCSVUserUploadResponse(
      index + 2,
      email,
      HttpStatus.OK,
      'success'
    );
  });
}

/**
 * Upload suppression users manually.
 *
 * @param emails string[]
 */
export async function uploadSuppressionUsers(schema: string, emails: string[]) {
  const emailAddresses = emails.map((email) => email.toLowerCase());
  const users = await userDao.findByEmailWhereIn(
    schema,
    { isDeleted: false },
    emailAddresses
  );
  const userEmails = _.map(users, 'email');
  await userDao.updateByEmailWhereIn(schema, userEmails, {
    isSuppressed: true
  });

  return emailAddresses.map((email) => {
    if (!userEmails.includes(email)) {
      return buildUserUploadResponse(
        email,
        HttpStatus.BAD_REQUEST,
        constructUserNotFound(email)
      );
    }

    return buildUserUploadResponse(email, HttpStatus.OK, 'success');
  });
}

/**
 * Fetched suppression users suggestions by search query.
 *
 * @param searchQuery string
 * @param max number
 */
export async function fetchSuppressionListByQuery(
  schema: string,
  searchQuery: string,
  max: number
): Promise<string[]> {
  return userDao.searchSuppressedUsersSuggestion(schema, searchQuery, max);
}

/**
 * Fetched suppression users by search query.
 *
 * @param searchQuery string
 * @param max number
 */
export async function fetchSuppressedUsersByQuery(
  schema: string,
  searchQuery: string,
  max: number
): Promise<ISuppressedUser[]> {
  return userDao.searchSuppressedUsers(schema, searchQuery, max);
}

/**
 * Validate suppression users to be uploaded
 *
 * @param emails string[]
 * @returns object[]
 */
export async function validateSuppressionUsers(
  schema: string,
  emails: string[]
): Promise<{ [key: string]: string | number }[]> {
  const emailAddresses = emails.map((email) => email.toLowerCase());
  const users = await userDao.findByEmailWhereIn(
    schema,
    { isDeleted: false },
    emailAddresses
  );
  const userEmails = _.map(users, 'email');

  return emailAddresses.map((email) => {
    if (!userEmails.includes(email)) {
      return buildUserUploadResponse(
        email,
        HttpStatus.BAD_REQUEST,
        constructUserNotFound(email)
      );
    }

    return buildUserUploadResponse(email, HttpStatus.OK, 'success');
  });
}
