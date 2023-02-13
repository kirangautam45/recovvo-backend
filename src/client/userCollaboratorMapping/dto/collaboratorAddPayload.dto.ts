/**
 *  Collaborator create payload Interface.
 */
interface AddCollaboratorPayload {
  collaboratorEmails: string[];
  collaboratorId?: number;
  isCustomAccessDurationSet: boolean;
  accessStartDate: Date | null;
  accessEndDate: Date | null;
}

export default AddCollaboratorPayload;
