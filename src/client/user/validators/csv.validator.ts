/**
 * user csv upload schema.
 */
export const csvHeaders = {
  firstName: 'FirstName',
  lastName: 'LastName',
  emailAddress: 'EmailAddress',
  userType: 'UserType',
  supervisorEmail: 'SupervisorEmail'
};

export const csvValidators: string[] = [
  csvHeaders.firstName,
  csvHeaders.lastName,
  csvHeaders.emailAddress,
  csvHeaders.userType,
  csvHeaders.supervisorEmail
];
