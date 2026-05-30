# deploying process for new server code 

1. pull files from git (commit from Rotem)
2. connect to Filezilla
3. copy existing server files to local folder "prev-server" (as a backup if something goes wrong)
4. upload new files to server: do not copy "prev-server", and "node_modules" folder
5. go to a2hosting.com, sign in and go to control panel
6. go to NodeJs application 
7. find drozyuval app  https://nl1-ss105.a2hosting.com:2083/cpsess7275985308/frontend/jupiter/lveversion/nodejs-selector.html.tt#/applications/api.drozyuval.com
7. click on "Stop Application" button
8. add any missing variables from .env file to the server variables
9. click on "Run NPM Install" button
10. click on "Start Application" button
11. test access to server frontend (a login page, then a list of inquiries)
    - www.api.drozyuval.com/admin
    - user: Rotemoz84@gmail.com
    - pass: Ozil0502!
12. test database access (now on supabase). https://supabase.com/dashboard/project/fzpdgsbrsvfnzmxdpxsz

