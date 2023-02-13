import BaseModel from '../baseModel';
import Table from '../common/enums/table.enum';

export const TABLE_NAME = Table.SUPER_ADMINS;

/**
 * Super Admin Model
 */
class SuperAdmins extends BaseModel {
  public static table: string = TABLE_NAME;
}

export default SuperAdmins;
