var google = require('googleapis')
var fs = require('fs')

var downloadFile = function(auth, drive, fileId, destName) {
    var dest = fs.createWriteStream('/tmp/' + destName);
    drive.files.get({
            auth: auth,
            fileId: fileId
        })
        .on('end', function() {
            console.log('Done');
        })
        .on('error', function(err) {
            console.log('Error during download', err);
        })
        .pipe(dest);
}

module.exports = {
    listFiles: function(auth) {
        var service = google.drive('v3');
        service.files.list({
            auth: auth,
            pageSize: 10,
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
                    if (file.name.match("IMG") || true) {
                        downloadFile(auth, service, file.id, file.name);
                    }
                }
            }
        });
    }
}
