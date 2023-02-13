import swaggerJsDoc from 'swagger-jsdoc';

export const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.2',
    info: {
      title: 'Recovvo Web Api',
      version: '1.0.0',
      description: 'This is a Recovvo web api'
    },
    tags: [
      {
        name: 'Onboarding'
      }
    ],
    schemas: ['https'],
    host: `${process.env.APP_HOST}:${process.env.APP_PORT}`,
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        BearerAuth: { type: 'http', scheme: 'bearer' }
      },
      schemas: {
        Organization: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            url: { type: 'string' },
            name: { type: 'string' },
            organizationType: { type: 'string' },
            organizationSize: { type: 'string' },
            isDeleted: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            isSuppressed: { type: 'boolean' },
            isAppUser: { type: 'boolean' },
            isVerified: { type: 'boolean' },
            isActive: { type: 'boolean' },
            hasSignedUp: { type: 'boolean' },
            isSupervisor: { type: 'boolean' },
            isAdmin: { type: 'boolean' },
            spUserId: { type: 'number' },
            position: { type: 'string' },
            organizationId: { type: 'number' },
            providerId: { type: 'number' },
            alternateProviderIds: {
              type: 'array',
              items: { type: 'number' }
            },
            firstName: { type: 'string' },
            middleName: { type: 'string' },
            lastName: { type: 'string' },
            isSystemUser: { type: 'boolean' },
            phoneNumbers: { type: 'array', items: { type: 'string' } },
            departmentId: { type: 'number' },
            invitationLink: { type: 'string' },
            lastLoginDate: { type: 'date' },
            isDeleted: { type: 'boolean' },
            invitedById: { type: 'number' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            isThreadsSynchronized: { type: 'boolean' }
          }
        },
        OrganizationSizeOperations: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            label: { type: 'string' },
            min: { type: 'number' },
            max: { type: 'number' }
          }
        },
        UserCollaboratorMapping: {
          type: 'object',
          properties: {
            collaboratorId: { type: 'number' },
            userId: { type: 'number' },
            fullname: { type: 'string' },
            accessStartDate: { type: 'date' },
            accessEndDate: { type: 'date' },
            email: { type: 'string' },
            isCustomAccessDurationSet: { type: 'boolean' }
          }
        },
        Email: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            snippet: { type: 'string' },
            subject: { type: 'string' },
            attachmentCount: { type: 'number' },
            lastUpdatedDatetime: { type: 'string' },
            senderReceiverEmails: {
              type: 'array',
              items: { type: 'string' }
            },
            emails: {
              type: 'array',
              items: { type: 'string' }
            },
            isSnippetHidden: { type: 'boolean' }
          }
        }
      }
    }
  },
  apis: ['**/*.ts'] // files containing annotations as above
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export default swaggerDocs;
