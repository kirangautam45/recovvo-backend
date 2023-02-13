/**
 * JWTPayload Interface.
 */
interface JWTPayload {
  name: string;
  email: string;
  userId?: number;
  role?: string;
}

export default JWTPayload;
