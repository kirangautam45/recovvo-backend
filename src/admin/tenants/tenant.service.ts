import TenantDto from './tenant.dto';
import * as tenantDao from './tenant.dao';
import errorMessages from './tenant.errors';
import logger from '../../core/utils/logger';
import config from '../../core/config/config';
import * as userDao from '../../client/user/user.dao';
import { TENANTS_ADDED_COLUMNS } from './tenant.constant';
import { sortObjectByNumber } from '../../core/utils/array';
import { getSortParams } from '../../core/utils/recovoUtils';
import * as mailService from '../../client/user/ses.service';
import * as userService from '../../client/user/user.service';
import RoleMapping from '../../client/user/mapper/role.mapper';
import * as superAdminDao from '../superAdmins/superAdmin.dao';
import NotFoundError from '../../core/exceptions/NotFoundError';
import * as emailTemplate from '../../core/utils/email-template';
import BadRequestError from '../../core/exceptions/BadRequestError';
import { getUserDomainForSchema } from '../../core/utils/recovoUtils';
import { DEFAULT_SORT_FIELD } from '../../client/common/constants/recovoConstant';

/**
 * Insert tenant details
 * @param tenantDetail
 */
export async function insert(tenantDetail: any, superAdminUserId: number) {
  logger.log('info', 'Inserting tenant to common database');

  const schemaName = getUserDomainForSchema(
    tenantDetail.organizationAdminEmail
  );

  const existingTenantWithSchema = await tenantDao.fetchFromSlug(schemaName);

  if (existingTenantWithSchema.length !== 0) {
    throw new BadRequestError(errorMessages.SchemaExistsAdminEmailError);
  }

  const tenantParams: { [key: string]: any } = {
    isActive: false,
    ...tenantDetail
  };

  if (schemaName) {
    tenantParams.slug = schemaName;
  }

  tenantParams.addedById = superAdminUserId;

  const response = await tenantDao.insert(tenantParams);

  const {
    emailSubject,
    emailMessage
  } = emailTemplate.generateTenantSetupMessageTemplate({
    ...tenantDetail,
    schemaName
  });
  const developerEmail = <string>config.mail.developerEmail;
  await mailService.sendMessage(
    String(developerEmail),
    emailSubject,
    emailMessage
  );

  return response;
}

export async function update(
  id: number,
  superAdminUserId: number,
  tenantDetail: any
) {
  logger.info(
    `Update the tenant with id ${id} with values ${JSON.stringify(
      tenantDetail
    )}`
  );

  const [tenant] = await tenantDao.fetchById(id);

  const superAdmin = await superAdminDao.fetchById(superAdminUserId);
  const addedBy = [superAdmin.firstName, superAdmin.lastName]
    .filter(Boolean)
    .join(' ');

  if (!tenant) {
    throw new NotFoundError(errorMessages.TenantNotFound);
  }

  if (
    tenantDetail.organizationAdminEmail &&
    tenantDetail.organizationAdminEmail != tenant.organizationAdminEmail &&
    tenant.is_schema_created
  ) {
    await updateTenantAdministrator(tenant, tenantDetail);
  }
  const [updatedTenant] = await tenantDao.update(id, tenantDetail);

  const { userCount, supervisorCount } = await getCountForUserAndSupervisor(
    tenant.isSchemaCreated,
    tenant.slug
  );

  return {
    ...updatedTenant,
    addedBy,
    userCount,
    supervisorCount
  };
}

/**
 * Update the new company admin to Tenant Administration and send email
 */
async function updateTenantAdministrator(tenant: TenantDto, tenantDetail: any) {
  logger.info(
    `Updating company admin in tenant ${tenant.slug} from ${tenant.organizationAdminEmail} to ${tenantDetail.organizationAdminEmail}`
  );
  const oldAdmin = await userDao.findByEmail(
    tenant.slug,
    tenant.organizationAdminEmail
  );
  const newAdmin = await userDao.findByEmail(
    tenant.slug,
    tenantDetail.organizationAdminEmail
  );

  if (!newAdmin) {
    throw new NotFoundError(errorMessages.UserNotFound);
  }

  if (!oldAdmin) {
    throw new NotFoundError(errorMessages.CompanyAdminNotFound);
  }

  await userDao.updateById(tenant.slug, Number(newAdmin.id), { isAdmin: true });
  await userDao.updateById(tenant.slug, Number(oldAdmin.id), {
    isAdmin: false
  });

  const {
    emailSubject,
    emailMessage
  } = emailTemplate.generateTenatAdminUpdateMessage({
    ...tenantDetail
  });
  const newAdminEmail = <string>newAdmin.email;
  return await mailService.sendMessage(
    String(newAdminEmail),
    emailSubject,
    emailMessage
  );
}

/**
 * Fetch all tenants
 */
export async function fetchAll(): Promise<TenantDto[]> {
  logger.log('info', 'Fetching all tenant details');

  return await tenantDao.fetchAll();
}

/**
 * Fetch tenant from slug
 */
export async function fetchFromSlug(slug: string) {
  logger.log('info', 'Fetching tenant details with slug: %s', slug);
  return await tenantDao.fetchFromSlug(slug);
}

/** Resend the company admin setup email to company admin
 * @params id: Tenant Id
 */
export async function resendInvitationToAdmin(id: number) {
  const [tenant] = await tenantDao.fetchById(id);
  if (!tenant) {
    throw new NotFoundError(errorMessages.TenantNotFound);
  }

  const organizationAdmin = await userDao.findByEmail(
    tenant.slug,
    tenant.organizationAdminEmail
  );

  if (!organizationAdmin) {
    throw new NotFoundError(errorMessages.CompanyAdminNotFound);
  }

  return await userService.sendEmail(
    tenant.slug,
    RoleMapping.ADMIN,
    organizationAdmin,
    config.mail.salesEmail
  );
}

/** Fetch tenant from id */
export async function fetchById(id: number, superAdminUserId: number) {
  logger.log('info', 'Fetching tenant details with id', id);
  const [tenant] = await tenantDao.fetchById(id);

  const superAdmin = await superAdminDao.fetchById(superAdminUserId);
  const addedBy = [superAdmin.firstName, superAdmin.lastName]
    .filter(Boolean)
    .join(' ');

  logger.info(
    'Fetching users information for tenant with slug %s',
    tenant.slug
  );

  const { userCount, supervisorCount } = await getCountForUserAndSupervisor(
    tenant.isSchemaCreated,
    tenant.slug
  );

  return {
    ...tenant,
    addedBy,
    userCount,
    supervisorCount
  };
}

/**
 * Delete tenant
 */
export async function deleteTenant(id: number) {
  logger.info('Deleting tenant with id %s', id);
  return await tenantDao.update(id, { isDeleted: true });
}

/**
 * Fetch paginated client contact information
 */
export async function fetchAllWithFilter(query?: any) {
  const sortParams = getSortParams(query, DEFAULT_SORT_FIELD);

  const tenants = await tenantDao.fetchTenantsWithFilter(sortParams);

  const tenantsDetails = await Promise.all(
    tenants.map(async (tenant: any) => {
      const {
        userCount,
        supervisorCount,
        activeUser,
        totalProviderUsers
      } = await getCountForUserAndSupervisor(
        tenant.isSchemaCreated,
        tenant.slug
      );

      return {
        ...tenant,
        userCount,
        supervisorCount,
        totalProviderUsers,
        activeUser
      };
    })
  );

  if (Object.keys(TENANTS_ADDED_COLUMNS).includes(sortParams.field)) {
    sortObjectByNumber(
      tenantsDetails,
      TENANTS_ADDED_COLUMNS[sortParams.field],
      sortParams.direction
    );
  }

  return tenantsDetails;
}

const getCountForUserAndSupervisor = async (
  isSchemaCreated: boolean,
  slug: string
): Promise<{
  userCount: number;
  supervisorCount: number;
  activeUser: number;
  totalProviderUsers: number;
}> => {
  if (!isSchemaCreated)
    return {
      userCount: 0,
      supervisorCount: 0,
      activeUser: 0,
      totalProviderUsers: 0
    };
  const totalUsers = await userDao.fetchAll(slug);
  const totalUsersCount = await userDao.fetchTotalUserCount(slug);
  return {
    userCount: totalUsers.length,
    totalProviderUsers: Number(totalUsersCount.count),
    supervisorCount: totalUsers.filter((user) => user.isSupervisor).length,
    activeUser: totalUsers.filter((user) => user.isActive).length
  };
};
