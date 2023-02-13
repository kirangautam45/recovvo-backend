/**
 * Constructs filter for users api
 *
 * @param filterParams object
 * @returns object
 */
export function constructUserFilter(filterParams: {
  [key: string]: any;
}): {
  [key: string]: any;
} {
  const filter: any = {
    'provider_users.isDeleted': false,
    'provider_users.isAppUser': true
  };
  if (filterParams.isActive !== undefined) {
    filter['provider_users.is_active'] = filterParams.isActive;
  }
  if (filterParams.isSuppressed !== undefined) {
    filter['provider_users.is_suppressed'] = filterParams.isSuppressed;
  }
  if (filterParams.hasSignedUp !== undefined) {
    filter['provider_users.has_signed_up'] = filterParams.hasSignedUp;
  }
  if (filterParams.withSupervisors !== undefined) {
    filter.withSupervisors = filterParams.withSupervisors;
  }
  return filter;
}
