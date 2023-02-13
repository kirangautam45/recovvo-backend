/**
 * IEmailAccessTimeFrame Interface
 */
interface emailAccessTimeFrame {
  id: number;
  isEmailAccessTimeFrameSet: boolean;
  isRollingTimeFrameSet: boolean;
  emailAccessStartDate: string | null;
  emailAccessTimeRangeInYears: number;
  emailAccessTimeRangeInDays: number;
}

export default emailAccessTimeFrame;
