import Knex from 'knex';
import config from '../config/config';
import * as messagePartService from '../../client/messagePart/messagePart.service';
import * as threadMessageService from '../../client/threadMessage/threadMessage.service';

const { tenantDb: tenantDbConfig } = config;

/**
 * Function that adds column to the table.
 */
async function addColumn(
  schemaName: string,
  tableName: string,
  columnName: string
) {
  const knexConnection = Knex(tenantDbConfig);

  const result = await knexConnection
    .select('*')
    .from('information_schema.columns')
    .whereRaw(
      `table_schema='${schemaName}' AND table_name = '${tableName}' AND column_name = '${columnName}'`
    );

  if (result.length > 0) {
    return;
  }
  console.info('Adding column to table...', tableName);

  return await knexConnection.schema
    .withSchema(schemaName)
    .alterTable(tableName, (table) => {
      table.boolean(columnName).defaultTo(false);
    });
}

/**
 * Function that removes column from the table.
 */
async function removeColumn(
  schemaName: string,
  tableName: string,
  columnName: string
) {
  const knexConnection = Knex(tenantDbConfig);
  console.info('removing column from table...', tableName);

  return await knexConnection.schema
    .withSchema(schemaName)
    .alterTable(tableName, (table) => {
      table.dropColumn(columnName);
    });
}

/**
 * Function that encodes string using base64
 */
function encodeBase64(message: string): string {
  return Buffer.from(message).toString('base64');
}

/**
 * Function that encodes subject and snippet
 */
export async function encodeSubjectSnippet(schema: string): Promise<void> {
  try {
    await addColumn(schema, 'message_parts', 'is_encoded');
    const messageParts = await messagePartService.find(schema, {
      isEncoded: false
    });

    await Promise.all(
      messageParts.map(async (messagePart) => {
        const encodedSubject = encodeBase64(messagePart.subject);

        return await messagePartService.update(schema, Number(messagePart.id), {
          subject: encodedSubject
        });
      })
    );
    await removeColumn(schema, 'message_parts', 'is_encoded');

    await addColumn(schema, 'thread_messages', 'is_encoded');
    const threadMessages = await threadMessageService.find(schema, {
      isEncoded: false
    });

    await Promise.all(
      threadMessages.map(async (threadMessage) => {
        const encodedSnippet = encodeBase64(threadMessage.snippet);

        return await threadMessageService.update(
          schema,
          Number(threadMessage.id),
          { snippet: encodedSnippet }
        );
      })
    );
    await removeColumn(schema, 'thread_messages', 'is_encoded');

    console.log('subject and snippet encoded ');
    process.exit(0);
  } catch (err) {
    console.log('error:', err);
    process.exit(1);
  }
}

const schema = process.argv[2];

if (!schema) {
  console.log('Schema name required');
  process.exit(2);
}

encodeSubjectSnippet(schema);
