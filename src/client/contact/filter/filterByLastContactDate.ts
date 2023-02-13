import Knex from 'knex';

import { START_DATE, END_DATE } from './contact.filter';
import UserSenderReceiverAssociation from '../../userSenderReceiverAssociation/userSenderReceiverAssociation.model';

/**
 * Filter by last contact date.
 *
 * @param queryBuilder
 * @param filter
 */
export const filterByLastContactDate = (
  schema: string,
  queryBuilder: any,
  filter: any
): Knex.QueryBuilder => {
  if (
    !(START_DATE in filter) ||
    filter[START_DATE] == '' ||
    !(END_DATE in filter) ||
    filter[END_DATE] == ''
  )
    return queryBuilder;

  const lastContactDate = UserSenderReceiverAssociation.lastContactDateSubQuery(
    schema
  ).toQuery();

  queryBuilder
    .whereRaw(`(${lastContactDate}) >= ?`, [filter[START_DATE]])
    .whereRaw(`(${lastContactDate}) <= ?`, [filter[END_DATE]]);

  return queryBuilder;
};
