export const defaultPageSize = 20;

export const orderConfig = (idFieldKey = 'id', orderDirection = 'desc') => [
  { field: idFieldKey, direction: orderDirection }
];

export const userOrderFields = {
  ID: 'id',
  EMAIL: 'email',
  USER: 'user',
  CLIENT_DOMAIN_COUNT: 'clientDomainCount',
  LAST_ACTIVE: 'lastActive'
};
