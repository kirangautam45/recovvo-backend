import * as userService from '../../client/user/user.service';

/**
 * Function that sends email invitation
 */
export async function sendEmail(email: string, schema: string): Promise<void> {
  try {
    if (await userService.sendEmailInvitation(schema, email)) {
      console.log('email successfully sent to ', email);
      process.exit(0);
    } else {
      console.log('email not sent to ', email);
      process.exit(1);
    }
  } catch (err) {
    console.log('error:', err);
    process.exit(1);
  }
}

const schema = process.argv[2];
const email = process.argv[3];

if (!email) {
  console.log('Email required');
  process.exit(1);
}

if (!schema) {
  console.log('Schema name required');
  process.exit(2);
}

if (!schema) {
  console.log('Schema name required');
  process.exit(2);
}

sendEmail(email, schema);
