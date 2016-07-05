var express = require('express')
var google = require('googleapis')
var url = require('url')
var config = require('./config.js')
var bodyParser = require('body-parser')
var open = require('open')
var aws = require('aws-sdk')

// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: true})

//app.use(express.static('public'));
var app = express()
//app.use(bodyParser);
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(config.CLIENT_ID, config.CLIENT_SECRET, config.REDIRECT_URL);

app.get('/',function(req,res){
   res.sendFile(__dirname+'/auth.html');
});

app.get('/auth',function(req,res) {
   console.log('in auth'+req.url);
   var urlObj = url.parse(req.url);
   var userid = urlObj.path.split('userid=')[1];
   console.log('userid '+userid);
   var gurl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        state: userid,
        prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/drive'
   }); 
    
    res.writeHead(301,{Location:gurl});
    res.end();
});
app.get('/download',function(req,res) {
    var urlObj = url.parse(req.url);
    var userid = decodeURIComponent(urlObj.path.split('userid=')[1]);
    console.log("Downloading a random file for "+userid);
    var ddb = new aws.DynamoDB({region: config.AWS_REGION,accessKeyId: config.AWS_ACCESS_ID,secretAccessKey: config.AWS_SECRET_KEY});
    var params = { "Key": {"userId":{"S":userid}},"TableName":config.TABLE_NAME};
    ddb.getItem(params,function(err,data) {
          if(err) console.log("error while retrieving user credentials "+err.stack);
          else {
                   var at = data.Item.at.S;
                   var rt = data.Item.rt.S;
                   oauth2Client.setCredentials ( {'access_token':data.Item.at.S,'refresh_token':data.Item.rt.S});
                   oauth2Client.refresh();
                   listFiles(oauth2Client);
               }
    });
    res.end("got your data successfully from DB");
    
});

function listFiles(auth) {
  var service = google.drive('v3');
  service.files.list({
    auth: auth,
    pageSize: 1,
    fields: "nextPageToken, files(id, name)"
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var files = response.files;
    if (files.length == 0) {
      console.log('No files found.');
    } else {
      console.log('Files:');
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        console.log(file);
        downloadFile(auth, service,file.id, file.name);
      }
    }
  });
}

function downloadFile(auth, drive, fileId, destName) { 
   var dest = fs.createWriteStream('/tmp/'+destName);
drive.files.get({
   auth: auth,
   fileId: fileId,
   alt: 'media'
})
.on('end', function() {
  console.log('Done');
})
.on('error', function(err) {
  console.log('Error during download', err);
})
.pipe(dest); 
}

app.get('/oauthcallback',function(req,res) {
   console.log('In oauthcallback '+req.url);
   var codere = /code=(\.)*/i;
   var statere = /\?state=(\.)*&/i;
   var urlPath = url.parse(req.url).path;
   var params = urlPath.split('oauthcallback?')[1];
   var userid = decodeURIComponent(split('&')[0].split('=')[1]);
   var code = params.split('&')[1].split('=')[1];
   console.log("code "+code+", userid "+userid);
   oauth2Client.getToken(code,function(err,tokens) {
      if(err) console.log(err,err.stack);
      oauth2Client.setCredentials(tokens);
      var ddb = new aws.DynamoDB({region: config.AWS_REGION,accessKeyId: config.AWS_ACCESS_ID,secretAccessKey: config.AWS_SECRET_KEY});
      var params = {
          "Item": {
             "userId" : { "S": userid},
             "at": {"S":tokens.access_token},
             "rt":{"S":tokens.refresh_token}
          },
          "TableName": config.TABLE_NAME

      };
      ddb.putItem(params,function(err,response) {
           if(err) console.log(err, err.stack);
           else res.end('successfully took your request. Data copy will start soon.');
      });
   });
});


var server = app.listen(config.PORT,function(){
   var host = server.address().address
   var port = server.address().port
   console.log("Starting server http://%s:%s",host,port);
});
