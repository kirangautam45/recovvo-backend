/**
 * List of database tables.
 */
enum Table {
  ORGANIZATION = 'organization',
  ORGANIZATION_OPERATION = 'organization_operation',
  PROVIDERS = 'providers',
  PROVIDER_USERS = 'provider_users',
  SESSION = 'session',
  USER_ACTIVITY = 'user_activity',
  ETL_OPERATION = 'ETL_operation',
  CLIENT_DOMAINS = 'client_domains',
  PROVIDER_USER_THREADS = 'provider_user_threads',
  THREAD_MESSAGES = 'thread_messages',
  MESSAGE_PARTS = 'message_parts',
  CLIENT_DOMAIN_CONTACTS = 'client_domain_contacts',
  PROVIDER_USERS_CLIENT_DOMAINS = 'provider_users_client_domains',
  ORGANIZATION_SIZES = 'organization_sizes',
  INDUSTRY_TYPES = 'industry_types',
  DEPARTMENTS = 'departments',
  PROVIDER_USERS_SUPERVISORS = 'provider_users_supervisors',
  USER_SENDER_RECEIVER_ASSOCIATION = 'user_sender_receiver_association',
  USAGE_REPORT = 'usage_report',
  SEARCH_REPORT = 'search_report',
  EVENT_LOGS = 'event_logs',
  PROVIDER_USERS_COLLABORATORS = 'provider_users_collaborators',
  PROVIDER_USERS_ALIASES = 'provider_user_aliases'
}

export default Table;
