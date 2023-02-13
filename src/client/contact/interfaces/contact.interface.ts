/**
 * Contact Interface.
 */
interface Contact {
  id?: number;
  firstName: string;
  lastName: string;
  position: string;
  contactOrganizationName: string;
  email: string;
  workPhoneNumber: string;
  cellPhoneNumber: string;
  address: string;
  emailsMetaData: any;
  clientDomainId: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export default Contact;
