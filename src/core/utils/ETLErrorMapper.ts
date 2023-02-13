const errors = {
  invalid_grant:
    "Project with this credential doesn't exists. Either create a new project or visit this link for adding credential.",
  unauthorized_client:
    'The necessary scopes are missing for us to be able to successfully fetch information. Please make sure that you added in all the required scopes from Step 3 in the admin console. Please verify the scopes here.',
  server_error: 'Something wrong with server'
};

export default errors;
