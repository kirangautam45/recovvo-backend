import JWTPayload from './jwtPayload.interface';

/**
 * LoggedInUser Interface.
 */
interface LoggedInUser extends JWTPayload {
  sessionId: number;
}

export default LoggedInUser;
