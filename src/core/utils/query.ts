import Knex from 'knex';
import { getCurrentAccessStartDate } from '../../client/organizationOperation/organizationOperation.service';

export const filterWithEmailOrNameQuery = (
  builder: Knex.QueryBuilder,
  searchParam: string,
  field: string
): Knex.QueryBuilder => {
  if (searchParam != '' && searchParam !== 'undefined') {
    builder
      .where(`${field}.email`, 'ilike', `%${searchParam}%`)
      .orWhere(`${field}.firstName`, 'ilike', `%${searchParam}%`)
      .orWhere(`${field}.lastName`, 'ilike', `%${searchParam}%`)
      .orWhereRaw(`CONCAT(${field}.first_name, ${field}.last_name) ilike ?`, [
        `%${searchParam.split(' ').join('')}%`
      ]);
  }

  return builder;
};

/**
 * Returns a query builder inside an object for message_datetime limit.
 *
 * @param builder QueryBuilder
 * @param schema schema
 * @param field Column whose datetime needs to be limited
 * @returns
 */
export async function filterByEmailAccessStartDateQuery(
  builder: Knex.QueryBuilder,
  schema: string,
  field: string
): Promise<Knex.QueryBuilder> {
  const organizationInfo = await getCurrentAccessStartDate(schema);
  if (organizationInfo.emailAccessStartDate) {
    builder.where(
      `${schema}.${field}.message_datetime`,
      '>=',
      organizationInfo.emailAccessStartDate
    );
  }

  return { queryBuilder: builder };
}
