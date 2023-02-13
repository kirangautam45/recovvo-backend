/**
 *  UserAlias Interface.
 */
interface UserAliasPayload {
  aliasUserId: number;
  userId: number;
  isCustomAccessDurationSet: boolean;
  aliasStartDate: Date | any;
  aliasEndDate: Date | any;
  historicalEmailAccessStartDate: Date;
  historicalEmailAccessEndDate: Date;
}

export default UserAliasPayload;
