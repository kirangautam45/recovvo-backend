/**
 *  Collaborator update payload interface.
 */
interface UpdateCollaboratorPayload {
  collaboratorEmails?: string[];
  isCustomAccessDurationSet: boolean;
  accessStartDate: Date;
  accessEndDate: Date;
}

export default UpdateCollaboratorPayload;
