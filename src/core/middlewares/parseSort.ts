import { Request, Response, NextFunction } from 'express';

export function parseSort(req: Request, _res: Response, next: NextFunction) {
  const { sort } = req.query;

  if (typeof sort === 'string') {
    const sorters = sort
      .split(',')
      .map((sortBy) =>
        sortBy[0] === '-'
          ? { order: -1, sortBy: sortBy.slice(1) }
          : { order: 1, sortBy }
      );

    // mutate the original request
    (req.query as any).sort = sorters;
  }

  next();
}
