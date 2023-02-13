import MessagePart from './messagePart.model';
import logger from '../../core/utils/logger';
import IMessagePart from './interfaces/messagePart.interface';
import VisibleProvidersInfo from './interfaces/visibleProvidersInfo.interface';

/**
 * Find message part by id.
 *
 * @returns Promise
 */
export async function findById(
  schema: string,
  id: number
): Promise<IMessagePart | null> {
  logger.log('info', 'Fetching message part by id %i from database', id);
  const [messagePart] = await MessagePart.find({ id }).withSchema(schema);
  return messagePart;
}

/**
 * finds all messagepart.
 * @params schema String
 * @params searchParams Object
 *
 * @returns Promise
 */
export async function find(
  schema: string,
  searchParams: any
): Promise<IMessagePart[]> {
  logger.log('info', 'Fetching message part from database');

  return await MessagePart.find(searchParams).withSchema(schema);
}

/**
 * Updates messagepart.
 * @params schema String
 * @params id Number
 * @params updateParams object
 *
 * @returns Promise
 */
export async function update(
  schema: string,
  id: number,
  updateParams: any
): Promise<IMessagePart> {
  logger.log(
    'info',
    `Updating messagePart with id ${id} with update params ${JSON.stringify(
      updateParams
    )}`
  );

  const [messagePart] = await MessagePart.updateMessagePartById(
    schema,
    { id },
    updateParams
  ).withSchema(schema);

  return messagePart;
}

/**
 * Fetch list of attachments by message ids.
 *
 * @param messageIds number[]
 */
export function fetchAttachmentsByMessageIdIn(
  schema: string,
  messageIds: number[]
): Promise<any> {
  logger.log(
    'info',
    'Fetching list of attachments by messages ids',
    messageIds.join(',')
  );

  return MessagePart.fetchAttachmentsByMessageIdIn(schema, messageIds);
}

/**
 * Fetch attachments with filter and page
 *
 * @param pageParams
 * @param sortParams
 * @param filter
 */
export function fetchAttachmentsWithFilterAndPage(
  schema: string,
  pageParams: { pageSize: number; page: number },
  sortParams: { field: string; direction: string },
  visibleProviderUsers: { data: VisibleProvidersInfo[]; contactId: number }[],
  filter?: any
): Promise<any> {
  logger.log('info', 'Fetching list of contacts with filter', filter);
  return MessagePart.fetchAttachmentsWithFilterAndPage(
    schema,
    pageParams,
    sortParams,
    visibleProviderUsers,
    filter
  );
}

/**
 * Fetch total number of attachments with filtered query.
 *
 * @param filter
 */
export function fetchTotalAttachmentsCount(
  schema: string,
  visibleProviderUsers: {
    data: any[];
    contactId: number;
  }[],
  filter?: any
): Promise<any> {
  logger.log('info', 'Fetch total number of attachments with filter', filter);
  return MessagePart.fetchTotalAttachmentsCount(
    schema,
    visibleProviderUsers,
    filter
  );
}
