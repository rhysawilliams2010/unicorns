'use strict';

const https = require('https');
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB();

exports.handler = (event, context, callback) => {
    console.log("unicorns!", event);
    savePart(event, (err, data)=>{
        console.log("savepart", err, data);
        getParts(event.Id, (err, data)=>{
            if(err){
                callback(err, null)
            }
            if(data.Count === event.TotalParts){
                const message = data.Items.reduce((a, c)=>{
                    a+= c["Data"]["S"];
                    return a;
                }, "");// concat all the parts IN ORDER!
                submitScore(event.Id, message, (err, data)=>{
                    if(err){
                        callback(err, null)
                    }
                    callback(null, "OK");
                });
            }
        });
    });
};

function savePart(event, callback){
    const params = {
        TableName : "Message",
        Item: {
            "Id" : {"S": event.Id},
            "PartNumber" : {"N": event.PartNumber.toString()},
            "Data" : {"S": event.Data}
        }
    };
    // TODO: conditional write?
    dynamodb.putItem(params, callback);
}
function getParts(id, callback) {
    var params = {
        TableName: "Message",
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames:{
            "#id": "Id"
        },
        ExpressionAttributeValues: {
            ":id": {"S":id}
        }
    };
    dynamodb.query(params, callback);
}
function submitScore(id, message, callback) {
    // TODO: who cares if we submit the same message twice? do we need a message lock?
    console.log("submitScore", id, message);

    var options = {
        hostname: 'dashboard.xero.gameday.nz',
        port: 443,
        path: '/score/' + id.toString(),
        method: 'POST',
        headers: {
            'x-gameday-token': 'd867479bbf'
        }
    };

    var req = https.request(options, (res) => {
        res.on('data', (d) => {
            callback(null, d);
        });
    });
    req.on('error', (e) => {
        console.error(e);
        callback(e)
    });
    req.write(message);
    req.end();
}
