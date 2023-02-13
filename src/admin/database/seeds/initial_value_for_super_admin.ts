import * as Knex from 'knex';

/**
 * Create a seed database
 * @param knex Promise
 */
export function seed(knex: Knex): Promise<any> {
  return knex('super_admins').insert([
    {
      email: 'spandanpyakurel@lftechnology.com',
      first_name: 'Spandan',
      last_name: 'Pyakurel'
    }
  ]);
}
