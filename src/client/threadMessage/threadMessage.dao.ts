import logger from '../../core/utils/logger';
import ThreadMessage from './threadMessage.model';
import IThreadMessage from './threadMessage.interface';

/**
 * Fetch list of thread messages by thread id.
 *
 * @param contactId number
 * @param filter Object
 */
export function fetchByThreadId(
  schema: string,
  threadId: number
): Promise<any> {
  logger.log('info', 'Fetching list of thread message by thread id', threadId);

  return ThreadMessage.fetchByThreadId(schema, threadId);
}

/**
 * Finds all thread messages.
 * @params schema String
 * @params searchParams Object
 *
 * @returns Promise
 */
export async function find(
  schema: string,
  searchParams: any
): Promise<IThreadMessage[]> {
  logger.log('info', 'Fetching thread messages from database');

  return await ThreadMessage.find(searchParams).withSchema(schema);
}

/**
 * Updates thread message.
 * @params schema String
 * @params id Number
 * @params updateParams Object
 *
 * @returns Promise
 */
export async function update(
  schema: string,
  id: number,
  updateParams: any
): Promise<IThreadMessage> {
  logger.log(
    'info',
    `Updating thread message with id ${id} with update params ${JSON.stringify(
      updateParams
    )}`
  );
  const [threadMessage] = await ThreadMessage.updateThreadMessageById(
    schema,
    { id },
    updateParams
  );

  return threadMessage;
}
