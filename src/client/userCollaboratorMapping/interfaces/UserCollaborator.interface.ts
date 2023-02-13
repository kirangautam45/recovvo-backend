/**
 *  ColaboratorUser Interface.
 */
interface CollaboratorUser {
  userId: number;
  collaboratorId: number;
  collaborationStartDate: Date | null;
  collaborationEndDate: Date | null;
  isCustomAccessDurationSet: boolean;
  fullName?: string;
  email?: string;
}

export default CollaboratorUser;
