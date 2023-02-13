import * as threadMessageDao from './threadMessage.dao';
import IThreadMessage from './threadMessage.interface';

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
  return await threadMessageDao.find(schema, searchParams);
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
  return await threadMessageDao.update(schema, id, updateParams);
}
