# gdrive
Google Drive Nodejs.

This is a nodejs server to get permissions to access a user's google drive and stores the tokens in a AWS' DynamoDB table. The following changes need to be made to make this work

A) Update Config.js to add appropriate config.
B) Install below node modules before running the server
   - sudo yum install nodejs npm --enablerepo=epel
   - Enable inbound traffic on 80 and 22 ports for the security group
   - sudo npm install googleapis --save
   - npm install open --save
   - npm install express --save
   - npm install body-parser --save
   - npm install aws-sdk
   
C) Running server ' node server.js'



