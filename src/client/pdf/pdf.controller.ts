import { Request, Response, NextFunction } from 'express';

/**
 * Download manual to create  a google api project.
 *
 * @param _ object
 * @param res object
 * @param next function
 */
export async function downloadGoogleWorkspaceSetupManual(
  _: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    res.download('src/client/common/manuals/GoogleApiManual.pdf');
  } catch (err) {
    next(err);
  }
}
