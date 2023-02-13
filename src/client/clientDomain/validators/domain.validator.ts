/**
 * Function that validates the domain is valid
 * @param domain string
 */
export function validateDomain(domain: string): boolean {
  return /([\w-]+\.)*[\w\-]+\.\w{2,10}/.test(domain);
}
