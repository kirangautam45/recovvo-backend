export const USER_SUPERVISOR_MAPPING_FILENAME = 'userSupervisorMapping.csv';
export const USER_COLLABORATOR_MAPPING_FILENAME = 'userCollaboratorMapping.csv';
export const USER_CLIENT_DOMAIN_MAPPING_FILENAME =
  'userClientDomainMapping.csv';
export const USER_ALIAS_MAPPING_FILENAME = 'userAliasMapping.csv';

export const ROUTES = {
  FETCH_ALIAS_EMAILS: '/:id/emails',
  FETCH_COLLABORATORS: '/:id/collaborators',
  REMOVE_ALL_ALIAS: '/:id/remove-all-alias',
  REMOVE_BULK_ALIAS: '/:id/remove-bulk-alias',
  ADD_COLLABORATORS: '/:id/add-collaborators',
  REMOVE_COLLABORATOR: '/:id/remove-collaborator',
  UPDATE_COLLABORATORS: '/:id/update-collaborators',
  UPLOAD_ALIAS_MAPPING: '/:id/upload-alias-mapping',
  UPLOAD_BULK_ALIAS_MAPPING: '/upload-alias-mapping',
  FETCH_SUBORDINATE_EMAILS_COUNT: '/:userId/emailsCount',
  REMOVE_ALL_COLLABORATORS: '/:id/remove-all-collaborators',
  DOWNLOAD_COLLABORATOR_MAPPINGS: '/download-collaborator-csv',
  POSSIBLE_COLLABORATOR_LIST: '/:id/possible-collaborator-list',
  UPLOAD_USER_COLLABORATOR_MAPPING: '/:id/upload-collaborator-csv',
  PERSONAL_CONTACT_SEARCH_PARAMS: '/personal-contact-search-params',
  UPLOAD_BULK_USER_COLLABORATOR_MAPPING: '/upload-collaborator-csv'
};
