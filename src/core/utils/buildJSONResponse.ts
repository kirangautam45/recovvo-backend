/**
 * Builds user upload response.
 *
 * @param email string
 * @param status number
 * @param message string
 */
export function buildUserUploadResponse(
  email: string,
  status: number,
  message: string
) {
  return { email, status, message };
}

/**
 * Builds csv user upload response.
 *
 * @param csvRow number
 * @param status number
 * @param message string
 */
export function buildCSVUserUploadResponse(
  csvRow: number,
  email: string,
  status: number,
  message: string
) {
  return { csvRow, email, status, message };
}

/**
 * Builds bulk collaborator mapping through upload response.
 *
 * @param csvRow number
 * @param status number
 * @param message string
 */
export function buildCSVBulkAliasMappingResponse(
  csvRow: number,
  userEmail: string,
  aliasEmail: string,
  status: number,
  message: string
) {
  return { csvRow, userEmail, aliasEmail, status, message };
}

/**
 * Builds bulk collaborator mapping through upload response.
 *
 * @param csvRow number
 * @param status number
 * @param message string
 */
export function buildCSVBulkCollaboratorMappingResponse(
  csvRow: number,
  userEmail: string,
  collaboratorEmail: string,
  status: number,
  message: string
) {
  return { csvRow, userEmail, collaboratorEmail, status, message };
}

/**
 * Build response for manual ClientDomainUser map and ClientDomain CSV upload
 *
 * @param domain string
 * @param status number
 * @param message string
 */
export function buildClientDomainResponse(
  domain: string,
  status: number,
  message: string
) {
  return { domain, status, message };
}

/**
 * Builds supervisor add response.
 *
 * @param email string
 * @param status number
 * @param message string
 */
export function buildSupervisorAddResponse(
  email: string,
  status: number,
  message: string,
  fullName?: string
) {
  return { email, fullName, status, message };
}

/**
 * Bulids manual collaborator add response
 * @param email string
 * @param status number
 * @param message string
 * @param fullName string
 * @returns object
 */
export function buildCollaboratorAddResponse(
  email: string,
  status: number,
  message: string,
  fullName?: string
) {
  return { email, fullName, status, message };
}

/**
 * Bulids aliash history add response
 * @param email string
 * @param status number
 * @param message string
 * @param fullName string
 * @returns object
 */
export function buildAliasAddResponse(
  email: string,
  status: number,
  message: string,
  fullName?: string
) {
  return { email, fullName, status, message };
}
