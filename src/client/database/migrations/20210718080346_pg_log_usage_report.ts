import * as Knex from 'knex';

const procedureName = 'public.pg_update_usage_report';

export function up(knex: Knex): Knex.Raw {
  const pg_updateUsageReport = `CREATE OR REPLACE PROCEDURE ${procedureName}(
      userdata json, 
      schemaname text)
      LANGUAGE 'plpgsql'
      AS $BODY$
      <<JSON_UPDATE_BLOCK>> 
      DECLARE
                mdata JSON = userData::JSON;
                mRecord record; 
                oldUsageReport record = NULL;
          queryString TEXT;
          resultVar record;
      BEGIN
        -- query to get user data from json field:
          queryString = FORMAT('
          SELECT logged_by AS logged_by,
                COALESCE(searches, 0) AS searches,
                COALESCE(emails_reviewed, 0) AS emails_reviewed,
                COALESCE(contact_exports, 0) AS contact_exports,
                COALESCE(attachment_exports, 0) AS attachment_exports,
                COALESCE(event_triggered_date, NOW()::DATE) AS event_triggered_date,
                last_search::TIMESTAMP WITH TIME ZONE AS last_search,
                COALESCE(updated_at, NOW()::TIMESTAMP WITH TIME ZONE) AS updated_at
                FROM json_populate_record(NULL::%I.usage_report, %L) 
          ', schemaname, mdata::JSON);
          
          EXECUTE queryString INTO mRecord;
          
                -- query to get old usage report at the event_triggered_date 
          queryString = FORMAT('
             SELECT * FROM %1$I.usage_report  WHERE
             event_triggered_date = %2$L AND
             logged_by = %3$L ORDER BY event_triggered_date DESC LIMIT 1 FOR UPDATE;
             ', schemaname, mRecord.event_triggered_date, mRecord.logged_by);
             
           EXECUTE queryString INTO oldUsageReport;
           
           IF oldUsageReport IS NOT NULL THEN
              --query to update the result based on old usage if event was triggered
            queryString = FORMAT('
               UPDATE %1$I.usage_report
                SET
                    searches = %2$L::INTEGER + %3$L::INTEGER,
                    emails_reviewed = %4$L::INTEGER + %5$L::INTEGER,
                    contact_exports = %6$L::INTEGER + %7$L::INTEGER,
                    attachment_exports = %8$L::INTEGER + %9$L::INTEGER
                WHERE
                    event_triggered_date = %10$L AND logged_by=%11$L
              ',
               schemaname,
               oldUsageReport.searches, 
               mRecord.searches,
               oldUsageReport.emails_reviewed,	
               mRecord.emails_reviewed,
               oldUsageReport.contact_exports,
               mRecord.contact_exports,
               oldUsageReport.attachment_exports,
               mRecord.attachment_exports,
               mRecord.event_triggered_date,
               mRecord.logged_by
            );
            
             EXECUTE queryString;
           ELSE
            -- new data
            queryString = FORMAT('
                INSERT INTO %1$I.usage_report(
                          searches, 
                          logged_by,
                          emails_reviewed, 
                          contact_exports, 
                          attachment_exports,
                          event_triggered_date,
                          last_search
                          ) VALUES
                          (%2$L,%3$L,%4$L, %5$L,%6$L, %7$L, %8$L);
                       ', schemaname,
                        mRecord.searches,
                        mRecord.logged_by,
                        mRecord.emails_reviewed,
                        mRecord.contact_exports,
                        mRecord.attachment_exports,
                        mRecord.event_triggered_date,
                        mRecord.last_search);
            EXECUTE queryString;
           END IF;
            
      END JSON_UPDATE_BLOCK;
    $BODY$;`;

  return knex.raw(pg_updateUsageReport);
}

export function down(knex: Knex): Knex.Raw {
  return knex.raw(`DROP PROCEDURE IF EXISTS ${procedureName};`);
}
