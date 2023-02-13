/**
 * MessagePart Interface.
 */
interface MessagePart {
  id?: number;
  isAttachment: boolean;
  attachmentUrl: string;
  messageId: number;
  subject: string;
}

export default MessagePart;
