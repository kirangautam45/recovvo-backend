import * as userDao from '../user/user.dao';
import logger from '../../core/utils/logger';
import errorMessage from '../user/user.errors';
import * as organizationDao from './organization.dao';
import * as industryDao from '../industry/industry.dao';
import * as departmentDao from '../department/department.dao';
import BadRequestError from '../../core/exceptions/BadRequestError';
import * as organizationSizeDao from '../organizationSize/organizationSize.dao';

/**
 * Update user and organization for client onboarding organization page
 * @param userId number
 * @param organizationId number
 * @param reqBody object
 */
export async function updateWithUser(
  schema: string,
  userId: number,
  organizationId: number,
  reqBody: any
) {
  let departmentId = null;
  let industryId = null;
  let organizationSizeId = null;

  const user = await userDao.findById(schema, userId);
  if (!user) {
    throw new BadRequestError(errorMessage.UserNotFound);
  }

  const organization = await organizationDao.findOne(schema, {
    id: organizationId
  });
  if (!organization) {
    throw new BadRequestError(errorMessage.OrganizationNotFound);
  }

  if (reqBody.userDepartment) {
    const department = await departmentDao.findOne(schema, {
      departmentKey: reqBody.userDepartment
    });
    if (!department) {
      throw new BadRequestError(errorMessage.DepartmentNotFound);
    }

    departmentId = department.id;
  }

  if (reqBody.organizationSize) {
    const organizationSize = await organizationSizeDao.findOne(schema, {
      sizeKey: reqBody.organizationSize
    });
    if (!organizationSize) {
      throw new BadRequestError(errorMessage.OrganizationSizeNotFound);
    }

    organizationSizeId = organizationSize.id;
  }

  if (reqBody.industry) {
    const industry = await industryDao.findOne(schema, {
      industryKey: reqBody.industry
    });
    if (!industry) {
      throw new BadRequestError(errorMessage.IndustryNotFound);
    }
    industryId = industry.id;
  }

  logger.info('Updating user', user);
  const userUpdated = await userDao.updateById(schema, userId, {
    departmentId: departmentId,
    position: reqBody.userPosition
  });

  logger.info('Updating organization', organization);
  const organizationUpdated = await organizationDao.updateById(
    schema,
    organizationId,
    {
      url: reqBody.organizationUrl,
      name: reqBody.organizationName,
      organizationSizeId: organizationSizeId,
      industryTypeId: industryId
    }
  );

  return { user: userUpdated, organization: organizationUpdated };
}
