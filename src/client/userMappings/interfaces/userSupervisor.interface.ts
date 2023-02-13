/**
 * UserSupervisor Interface.
 */
interface UserSupervisor {
  id?: number;
  supervisorId: number;
  userId: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default UserSupervisor;
