import JWTPayload from './jwtPayload.dto';

/**
 * LoggedInUser Interface.
 */
interface LoggedInUser extends JWTPayload {
  sessionId?: number;
}

export default LoggedInUser;
