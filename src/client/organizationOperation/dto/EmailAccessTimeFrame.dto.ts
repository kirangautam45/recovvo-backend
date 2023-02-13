/**
 *  EmailAccessTimeFrame Interface.
 */
interface EmailAccessTimeFramePayload {
  isEmailAccessTimeFrameSet: boolean;
  isRollingTimeFrameSet: boolean;
  emailAccessStartDate: string | null;
}

export default EmailAccessTimeFramePayload;
