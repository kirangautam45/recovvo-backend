/**
 * UserSessionPayload Interface.
 */
interface UserSessionPayload {
  token: string;
  userId: number;
  isActive?: boolean;
}

export default UserSessionPayload;
