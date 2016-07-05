var aws = require('aws-sdk');
var ddb = new aws.DynamoDB({ region: config.AWS_REGION, accessKeyId: config.AWS_ACCESS_ID, secretAccessKey: config.AWS_SECRET_KEY });

module.exports = {
    get: function(tableName, key, callback) {
        var params = { Key: key, TableName: tableName };
        console.log(params);
        ddb.getItem(params, function(err, data) {
            if (err) console.log("error while retrieving user credentials " + err.stack);
            callback && callback(err, data);
        });
    },

    put: function(tableName, item, callback) {
        var params = {
            Item: item,
            TableName: tableName
        };

        ddb.putItem(params, function(err, response) {
            if (err) console.log(err, err.stack);
            else res.end('successfully took your request. Data copy will start soon.');
            callback && callback(err, response);
        });
    }
}
