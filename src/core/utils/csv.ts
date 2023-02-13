import fs from 'fs';
import papa from 'papaparse';

/**
 * Validate csv file format
 *
 * @param filePath string
 */
export function validateFileFormat(filePath: string) {
  return /^.+\.csv$/.test(filePath);
}

/**
 * Processes CSV file
 *
 * @param filePath string
 * @Promise
 */
export function readCSV(
  filePath: string
): Promise<{ headers: any; results: any[]; errors: any[] }> {
  return new Promise((resolve, _) => {
    const file = fs.createReadStream(filePath);
    papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        fs.unlinkSync(filePath);
        resolve({
          headers: results.meta.fields,
          results: results.data,
          errors: results.errors
        });
      }
    });
  });
}

/**
 * Converts JSON data to csv
 *
 * @param jsonData object[]
 * @returns string
 */
export function convertJsonToCSV(
  headers: string[],
  jsonData: { [key: string]: any }[]
): string {
  return papa.unparse({ fields: headers, data: jsonData });
}

/**
 * Get Csv Row if the CSV rows iterated in reverse manner.
 *
 */
export const getCsvRow = (totalLength: number, index: number): number => {
  return totalLength - index + 1;
};
