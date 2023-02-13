/**
 * Function that validates the email is valid
 * @param email string
 */
export function validateEmail(email: string): boolean {
  return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
}
