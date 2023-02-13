/**
 *  UserAddPayload Interface.
 */
interface UserAddPayload {
  isActive: boolean;
  isSystemUser: boolean;
  firstName?: string;
  lastName?: string;
  invitedById?: number;
}

export default UserAddPayload;
