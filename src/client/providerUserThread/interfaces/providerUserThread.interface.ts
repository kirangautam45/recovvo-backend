/**
 * Provider user threads interface.
 */
interface ProviderUserThread {
  id: number;
  subject: string;
  snippet: string;
  attachmentCount: string;
  emails: string[];
  lastUpdatedDatetime: Date;
  senderReceiverEmails: string;
  isSnippetHidden: boolean;
}

export default ProviderUserThread;
