/**
 * UserAlias Interface.
 */
interface IUserAlias {
  id?: number;
  userId: number;
  aliasUserId: number;
  isCustomAccessDurationSet: boolean;
  aliasStartDate: Date;
  aliasEndDate: Date;
  historicalEmailAccessStartDate: Date;
  historicalEmailAccessEndDate: Date;
  mappingHistory: any;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * UserAlias Success Interface.
 */
interface IRemoveAliasState {
  status: number;
  email: string;
}

export { IUserAlias, IRemoveAliasState };
