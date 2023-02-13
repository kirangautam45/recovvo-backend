/**
 *  UserPayload Interface.
 */
interface UserPayload {
  firstName: string;
  lastName: string;
  isActive?: boolean;
  invitedById?: number;
  organizationId: number;
  email: string;
  password: string;
}

export default UserPayload;
