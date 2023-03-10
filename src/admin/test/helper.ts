import faker from 'faker';

import knex from '../../core/config/knex';
import Table from '../../client/common/enums/table.enum';

const tables = [Table.USER_SESSIONS, Table.USERS];

/**
 * Delete all table's data.
 */
export async function clearDb(): Promise<void> {
  for (const table of tables) {
    await knex(table).del();
  }
}

/**
 * Get a random element from given array.
 *
 * @param {any[]} list
 * @returns {any}
 */
export function getRandomElement(list: any[]): any {
  return faker.random.arrayElement<any>(list);
}
