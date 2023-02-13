/**
 * Construct supervisor successfully added message
 *
 * @param email string
 * @returns string
 */
export function constructSupervisorAddSuccess(email: string): string {
  return `Successfully assigned supervisor with email ${email}.`;
}
/**
 * Construct collaborator successfully added message
 * @param email string
 * @returns string
 */
export function constructCollaboratorAddSuccess(email: string): string {
  return `Successfully assigned as collaborator of email ${email}.`;
}

/**
 * Construct collaborator successfully updated message
 * @param email string
 * @returns string
 */
export function constructCollaboratorUpdateSuccess(): string {
  return `Collaboration detail successfully updated`;
}

/** Constructs alias added success message.
 *
 * @param email string
 * @returns string
 */
export function constructAliasAddSuccess(email: string): string {
  return `Successfully assigned alias with email ${email}.`;
}
