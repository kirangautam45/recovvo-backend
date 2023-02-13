/**
 * SuperAdmin Interface.
 */
interface SuperAdmin {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isDeleted: boolean;
}

export default SuperAdmin;
