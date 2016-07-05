var express = require('express')
var google = require('googleapis')
var url = require('url')
GLOBAL.config = require('./config.js')
var gph = require('./googleAPIHelper.js')
var dynamoClient = require('./dynamoClient.js')

var app = express()
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(config.CLIENT_ID, config.CLIENT_SECRET, config.REDIRECT_URL);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/auth.html');
});

app.get('/auth', function(req, res) {
    console.log('in auth' + req.url);
    var urlObj = url.parse(req.url);
    var userid = urlObj.path.split('userid=')[1];
    console.log('userid ' + userid);
    var gurl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        state: userid,
        prompt: 'consent',
        scope: 'https://www.googleapis.com/auth/drive'
    });

    res.writeHead(301, { Location: gurl });
    res.end();
});
app.get('/download', function(req, res) {
    var urlObj = url.parse(req.url);
    var userid = decodeURIComponent(urlObj.path.split('userid=')[1]);
    console.log("Downloading a random file for " + userid);
    var key = { userId: { S: userid } };
    dynamoClient.get(config.TABLE_NAME, key, function(err, data) {
        oauth2Client.setCredentials({ access_token: data.Item.at.S });
        gph.listFiles(oauth2Client);
    });
    res.end("got your data successfully from DB");
});

app.get('/oauthcallback', function(req, res) {
    console.log('In oauthcallback ' + req.url);
    var codere = /code=(\.)*/i;
    var statere = /\?state=(\.)*&/i;
    var urlPath = url.parse(req.url).path;
    var params = urlPath.split('oauthcallback?')[1];
    var userid = decodeURIComponent(params.split('&')[0].split('=')[1]);
    var code = params.split('&')[1].split('=')[1];
    console.log("code " + code + ", userid " + userid);
    oauth2Client.getToken(code, function(err, tokens) {
        if (err) console.log(err, err.stack);
        oauth2Client.setCredentials(tokens);
        dynamoClient.put(config.TABLE_NAME, {
            userId: { "S": userid },
            at: { "S": tokens.access_token },
            rt: { "S": tokens.refresh_token }
        });
    });
});

var server = app.listen(config.PORT, function() {
    var host = server.address().address
    var port = server.address().port
    console.log("Starting server http://%s:%s", host, port);
});
