/**
 *  UserUpdatePayload Interface.
 */
interface UserUpdatePayload {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  role?: string;
  phoneNumbers?: string[];
  department?: string;
}

export default UserUpdatePayload;
