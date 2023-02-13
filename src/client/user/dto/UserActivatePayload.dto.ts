/**
 *  UserActivatePayload Interface.
 */
interface UserActivatePayload {
  isActive: boolean;
  isSystemUser: boolean;
  firstName?: string;
  lastName?: string;
  invitedById?: number;
}

export default UserActivatePayload;
