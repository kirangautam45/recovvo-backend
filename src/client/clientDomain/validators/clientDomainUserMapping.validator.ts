/**
 * cient domain to user mapping csv upload schema.
 */
export const clientDomainUserHeaders = {
  emailAddress: 'EmailAddress',
  domainUrl: 'DomainUrl'
};

export const clientDomainUserValidators: string[] = [
  clientDomainUserHeaders.emailAddress,
  clientDomainUserHeaders.domainUrl
];
