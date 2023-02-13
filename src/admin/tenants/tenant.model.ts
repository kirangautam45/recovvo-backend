import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';
import { TENANTS_ADDED_COLUMNS } from './tenant.constant';

export const TABLE_NAME = 'tenants';

/**
 * Tenant Model
 */
class Tenants extends BaseModel {
  public static table: string = Table.TENANTS;

  static fetchWithFilter(sortParams: { field: string; direction: string }) {
    let queryBuilder = super
      .queryBuilder()(Table.TENANTS)
      .select(
        `${Table.TENANTS}.id`,
        `${Table.TENANTS}.slug`,
        `${Table.TENANTS}.organization_name`,
        `${Table.TENANTS}.organization_admin_first_name`,
        `${Table.TENANTS}.organization_admin_last_name`,
        `${Table.TENANTS}.organization_admin_email`,
        `${Table.TENANTS}.is_active`,
        `${Table.TENANTS}.is_deleted`,
        `${Table.TENANTS}.is_schema_created`,

        super
          .getConnection()
          .raw(
            `CONCAT(super_admin.first_name, ' ', super_admin.last_name) as addBy`
          )
      )
      .joinRaw(
        `LEFT JOIN ${Table.SUPER_ADMINS} as super_admin ON super_admin.id = ${Table.TENANTS}.added_by_id`
      );

    queryBuilder = this.addOrderBy(queryBuilder, sortParams);

    return queryBuilder;
  }

  static addOrderBy(qb: any, sortParams: { field: string; direction: string }) {
    const nullLast = 'NULLS LAST';
    const direction =
      sortParams.direction.toLowerCase() == 'asc' ? 'ASC' : 'DESC';

    if (Object.keys(TENANTS_ADDED_COLUMNS).includes(sortParams.field)) {
      return qb;
    }

    return qb.orderByRaw(`${sortParams.field} ${direction} ${nullLast}`);
  }

  /**
   * Fetch list of filtered contacts with paginate
   *
   * @param pageParams
   * @param sortParams
   * @param filter
   */
  static findWithFilterAndPage(
    pageParams: { page: number; pageSize: number },
    sortParams: { field: string; direction: string }
  ) {
    const offset = (pageParams.page - 1) * pageParams.pageSize;
    const tenants = this.fetchWithFilter(sortParams);

    tenants.offset(offset).limit(pageParams.pageSize);

    return tenants;
  }
}

export default Tenants;
