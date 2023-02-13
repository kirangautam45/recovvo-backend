import ETLErrorMapper from '../utils/ETLErrorMapper';

/**
 * Constructs required message error.
 *
 * @param param string
 * @returns string
 */
export function constructReuiredMessage(param: string): string {
  return `\"${param}"\ is required`;
}

/**
 * Constructs not allowed message error.
 *
 * @param param string
 * @returns string
 */
export function constructNotAllowedMessage(param: string): string {
  return `\"${param}"\ is not allowed`;
}

/**
 * Constructs user not found error message.
 *
 * @param emailAddress string
 * @returns string
 */
export function constructUserNotFound(emailAddress: string): string {
  return `User with email "${emailAddress}" not found`;
}

/**
 * Constructs supervisor not found error message.
 *
 * @param emailAddress string
 * @returns string
 */
export function constructSupervisorNotFound(emailAddress: string): string {
  return `Supervisor with email "${emailAddress}" not found`;
}

/**
 * Constructs role not valid error message.
 *
 * @param role string
 * @returns string
 */
export function constructRoleNotValid(role: string): string {
  return `User type "${role}" not valid`;
}

/**
 * Constructs client domain not valid error message.
 *
 * @param clientDomain string
 * @returns string
 */
export function constructClientDomainNotValid(clientDomain: string): string {
  return `Client domain "${clientDomain}" not valid`;
}

/**
 * Constructs client domain unprocessable error message.
 *
 * @param clientDomain
 * @returns string
 */
export function constructClientDomainUnprocessable(
  clientDomain: string
): string {
  return `Client domain "${clientDomain}" cannot be used`;
}

/**
 * Constructs user is not supervisor error message
 *
 * @param emailAddress string
 * @returns string
 */
export function constructUserNotSupervisor(emailAddress: string): string {
  return `User with email ${emailAddress} is not a supervisor`;
}

/**
 * Constructs user cannot be own supervisor error message
 *
 * @param emailAddress string
 * @returns string
 */
export function constructUserCannotBeSupervisor(emailAddress: string): string {
  return `User with email ${emailAddress} cannot be supervisor of self`;
}

/**
 * Constructs client domain not found error message.
 *
 * @param clientDomain string
 * @returns string
 */
export function constructClientDomainNotFound(clientDomain: string): string {
  return `Client domain "${clientDomain}" not found`;
}

/** Constructs self supervisor not allowed error message.
 *
 * @param role string
 * @returns string
 */
export function constructSelfSupervisorNotAllowed(): string {
  return `Users cannot be added as Supervisors of themselves`;
}

/** Constructs schema name required error message.
 *
 * @param role string
 * @returns string
 */
export function constructSchemaNameRequired(): string {
  return `Please provide schema name`;
}

/**
 * Constructs collaborator not found error message.
 *
 * @param emailAddress string
 * @returns string
 */
export function constructCollaboratorNotFound(emailAddress: string): string {
  return `Collaborator with email "${emailAddress}" not found`;
}

/**
 * Constructs alias not found error message.
 *
 * @param emailAddress string
 * @returns string
 */
export function constructAliasNotFound(emailAddress: string): string {
  return `Alias with email "${emailAddress}" not found`;
}

/** Constructs self collaborator not allowed error message.
 *
 * @returns string
 */
export function constructSelfCollaborationNotAllowed(): string {
  return `User cannot be added as Collaborator of themself`;
}

/** Constructs self alias not allowed error message.
 *
 * @returns string
 */
export function constructSelfAliasNotAllowed(): string {
  return `Users cannot be added as aliases of themselves`;
}

/**
 * Constructs user is not alias error message
 *
 * @param emailAddress string
 * @returns string
 */
export function constructUserNotAlias(emailAddress: string): string {
  return `User with email ${emailAddress} is not a alias`;
}

/**
 * Constructs user is already an alias error message
 *
 * @param emailAddress string
 * @returns string
 */
export function constructAliasAlreadyPresent(): string {
  return `User already an alias`;
}

export function constructEtlErrorMessage(etlMessage: {
  code: number;
  status: string;
  message: string;
}): string {
  if (etlMessage.status === 'PERMISSION_DENIED') return etlMessage.message;

  if (etlMessage.status === 'unauthorized_client') {
    const redirect_url = 'https://admin.google.com/ac/owl';
    return ETLErrorMapper.unauthorized_client + ' ' + redirect_url;
  }

  if (etlMessage.status === 'invalid_grant') {
    const redirect_url = 'https://console.cloud.google.com/apis/credentials';
    return ETLErrorMapper.invalid_grant + ' ' + redirect_url;
  }

  return ETLErrorMapper.server_error;
}
