/**
 *  Collaborator fetch payload interface.
 */
interface FetchCollaboratorPayload {
  fullName: string | undefined;
  email: string | undefined;
  id: number;
}

export default FetchCollaboratorPayload;
