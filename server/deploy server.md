# Deploying Process For New Server Code

1. pull files from git (commit from Rotem)
2. connect to Filezilla
3. copy existing server files to local folder "prev-server" (as a backup if something goes wrong)
4. upload new files to server: do not copy "prev-server", and "node_modules" folder
5. go to a2hosting.com, sign in and go to control panel
6. go to NodeJs application 
7. find drozyuval app  https://nl1-ss105.a2hosting.com:2083/cpsess7275985308/frontend/jupiter/lveversion/nodejs-selector.html.tt#/applications/api.drozyuval.com
7. click on "Stop Application" button
8. add any missing variables from .env file to the server variables, including:
    - DEPLOYMENT_SUCCESS_EMAIL_TO for deployment confirmations and critical failure alerts
    - DEPLOYMENT_AUTOMATION_ENABLED=true so "Run NPM Install" performs deployment checks, startup requires readiness, and "Start Application" sends the success email automatically
9. click on "Run NPM Install" button. This automatically runs deployment preflight when DEPLOYMENT_AUTOMATION_ENABLED=true.
10. if the npm install/preflight step fails, stop here and keep the previous server backup available.
11. click on "Start Application" button. In production, startup runs critical readiness checks before listening.
12. after startup succeeds, the server sends successful deployment confirmation automatically when DEPLOYMENT_AUTOMATION_ENABLED=true.
13. test access to server frontend (a login page, then a list of inquiries)
    - www.api.drozyuval.com/admin
    - use the secured admin credentials
14. test readiness:
    - https://api.drozyuval.com/api/ready
15. test database access (now on supabase). https://supabase.com/dashboard/project/fzpdgsbrsvfnzmxdpxsz
