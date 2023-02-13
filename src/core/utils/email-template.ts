/**
 * Email Template for invitation
 */
export function generateInvitationEmailMessageTemplate(
  role: string,
  invitationLink: string
): { emailSubject: string; emailMessage: string } {
  const emailMessage = `<html>
  <div><img src="https://recovvo-documentation-assets.s3.us-east-2.amazonaws.com/images/recovvo-logo.png"> </div><body><div style="padding: 20px; background: #E5E5E5">
    <div style = " width: 500px;padding: 20px; margin-top: 10px; font-size: 16px;font-style: normal; font-family: SF Pro Text; background: #FFFFFF">
    <div style="font-weight: bold"> Hi there! </div>
    <p> You have been invited to join Recovvo as the ${role} for your organization. Please click on the button below to accept the invitation and set up your company. </p>
    <div style="margin: 30px 0px;">
    <a style = "font-weight: bold; text-decoration: none; cursor:pointer; background: #8B46FF; border: 1px solid #8B46FF; color: white; padding: 10px 20px;" href="${invitationLink}"> Set up your acccount </a>
    </div>
    <p> Unable to click the button? Follow this link instead.</p>
    <a href = '${invitationLink}'>Activation Link</a>
    <div style="  margin-top:20px;">
      <div> Best, </div>
      <div> Jordan from Recovvo </div>
    </div></div></div></body></html>`;
  const emailSubject =
    'You have been invited to join Recovvo for your organization';
  return { emailSubject, emailMessage };
}

/**
 * Email Template for ETL process Trigerr
 */
export function generateETLTriggerMessageTemplate(
  organizationName: string,
  schemaName: string
): { emailSubject: string; emailMessage: string } {
  const emailMessage = `<html>
  <div><img src="https://recovvo-documentation-assets.s3.us-east-2.amazonaws.com/images/recovvo-logo.png"> </div><body><div style="padding: 20px; background: #E5E5E5">
    <div style = " width: 500px;padding: 20px; margin-top: 10px; font-size: 16px;font-style: normal; font-family: SF Pro Text; background: #FFFFFF">
    <div style="font-weight: bold"> Dear development team, </div>
    <p> You are requested to perform the ETL process for <b> ${organizationName} </b> organization with schema name <b> ${schemaName}. </b> </p>
    <div style="margin: 30px 0px;">
    <div> Best, </div>
      <div> Jordan from Recovvo </div>
    </div></div></div></body></html>`;
  const emailSubject = `You are requested to trigger the etl process for new tenant ${organizationName}`;
  return { emailSubject, emailMessage };
}

/**
 * Email Template for ETL process Trigerr
 */
export function generateTenantSetupMessageTemplate(tenantDetail: {
  [key: string]: string;
}): { emailSubject: string; emailMessage: string } {
  const emailMessage = `<html>
  <div><img src="https://recovvo-documentation-assets.s3.us-east-2.amazonaws.com/images/recovvo-logo.png"> </div><body><div style="padding: 20px; background: #E5E5E5">
    <div style = " width: 500px;padding: 20px; margin-top: 10px; font-size: 16px;font-style: normal; font-family: SF Pro Text; background: #FFFFFF">
    <div style="font-weight: bold"> Dear development team, </div>
    <p> You are requested to setup for organization with following information </p>
    <p> <b>Admin Email: </b>${tenantDetail.organizationAdminEmail} 
    <br> <b>Organization Name: </b>${tenantDetail.organizationName || ''}
    <br> <b>Admin First Name: </b>${
      tenantDetail.organizationAdminFirstName || ''
    } 
    <br> <b>Admin Last Name: </b>${
      tenantDetail.organizationAdminLastName || ''
    } 
    <br> <b>Schema Name: </b>${tenantDetail.schemaName} </p>
    <div style="margin: 30px 0px;">
    <div> Best, </div>
      <div> Jordan from Recovvo </div>
    </div></div></div></body></html>`;
  const emailSubject = `You have requested to setup the tenant for organization ${tenantDetail.organizationName}`;
  return { emailSubject, emailMessage };
}

/**
 * Email Template for ETL process Trigerr
 */
export function generateTenatAdminUpdateMessage(tenantDetail: {
  [key: string]: string;
}): { emailSubject: string; emailMessage: string } {
  const emailMessage = `<html>
  <div><img src="https://recovvo-documentation-assets.s3.us-east-2.amazonaws.com/images/recovvo-logo.png"> </div><body><div style="padding: 20px; background: #E5E5E5">
    <div style = " width: 500px;padding: 20px; margin-top: 10px; font-size: 16px;font-style: normal; font-family: SF Pro Text; background: #FFFFFF">
    <div style="font-weight: bold"> Dear ${
      tenantDetail.organizationAdminFirstName
    }, </div>
    <p> You have been updated to Admin for the organization <b> ${
      tenantDetail.organizationName || ''
    } </b> </p>
    <div style="margin: 30px 0px;">
    <div> Best, </div>
      <div> Jordan from Recovvo </div>
    </div></div></div></body></html>`;
  const emailSubject = 'You have been updated to Admin in Recovvo';
  return { emailSubject, emailMessage };
}
