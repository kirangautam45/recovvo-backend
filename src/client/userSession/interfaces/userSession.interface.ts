/**
 * UserSession interface.
 */
interface UserSession {
  id: number;
  token: string;
  userId: number;
  isActive: boolean;
  updatedBy?: string;
  createdBy?: string;
}

export default UserSession;
