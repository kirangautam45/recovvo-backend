import Multer from 'multer';
import { Router } from 'express';
import { schema } from '../../core/middlewares/validate';
import authorize from '../../core/middlewares/authorize';
import authenticate from '../../core/middlewares/authenticate';
import { validateCSV } from '../../core/middlewares/validateCSV';
import * as clientDomainController from './clientDomain.controller';
import { clientDomainCsvValidators } from './validators/csv.validator';
import { clientDomainValidator } from './validators/clientDomains.validator';
import { clientDomainUserValidators } from './validators/clientDomainUserMapping.validator';

const router: Router = Router();
const upload = Multer({ dest: 'tmp/csv/' });

router.get(
  '/download-csv',
  authenticate,
  authorize,
  clientDomainController.downloadClientDomainCSV
);

router.post(
  '/upload-domain-csv',
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(clientDomainCsvValidators),
  clientDomainController.uploadDomainCSV
);

router.post(
  '/users-csv-upload',
  authenticate,
  authorize,
  upload.single('file'),
  validateCSV(clientDomainUserValidators),
  clientDomainController.uploadClientDomainsUsers
);

router.post(
  '/validate',
  authenticate,
  authorize,
  schema(clientDomainValidator),
  clientDomainController.validateClientDomains
);

router.get(
  '/',
  authenticate,
  authorize,
  clientDomainController.fetchClientDomains
);

router.delete(
  '/:id/delete',
  authenticate,
  authorize,
  clientDomainController.removeClientDomain
);

export default router;
