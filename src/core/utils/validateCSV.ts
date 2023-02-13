import DataPayload from '../common/dto/csvErrorData.dto';
import {
  constructReuiredMessage,
  constructNotAllowedMessage
} from './errorMessage';

/**
 * Utility helper for CSV header validation.
 *
 * @param <string[]> data
 * @param <string[]> schema
 * @returns <Promise>
 */
export default async function validateCSV(
  data: string[],
  schema: string[]
): Promise<DataPayload[]> {
  const required = schema.filter((x) => !data.includes(x));
  const notAllowed = data.filter((x) => !schema.includes(x));
  const errorMessage: { header: string; message: string }[] = [];
  required.length &&
    required.map((errorHeader) => {
      errorMessage.push({
        header: errorHeader,
        message: constructReuiredMessage(errorHeader)
      });
    });

  notAllowed.length &&
    notAllowed.map((errorHeader) => {
      errorMessage.push({
        header: errorHeader,
        message: constructNotAllowedMessage(errorHeader)
      });
    });

  return errorMessage;
}
