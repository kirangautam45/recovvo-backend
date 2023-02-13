import moment from 'moment';

import * as organizationOperationDao from '../organizationOperation/organizationOperation.dao';
export async function findAccessDuration(
  schema: string,
  accessStartDate: Date | null,
  accessEndDate: Date | null
): Promise<{
  accessStartDate: Date | null;
  accessEndDate: Date | null;
}> {
  const organizationOperation = await organizationOperationDao.findOne(schema, {
    slug: schema
  });

  const isDefaultCollaboratorExpirySet =
    organizationOperation.isDefaultCollaboratorExpirySet;

  if (!accessStartDate) {
    accessStartDate = new Date();
  }

  if (accessStartDate && !accessEndDate) {
    accessEndDate = moment(accessStartDate)
      .add(organizationOperation.defaultCollaboratorExpiryDuration, 'days')
      .toDate();

    if (!isDefaultCollaboratorExpirySet) {
      accessEndDate = null;
    }
  }

  return {
    accessStartDate,
    accessEndDate
  };
}
