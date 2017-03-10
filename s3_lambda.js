'use strict';

console.log('Loading function');

const aws = require('aws-sdk');

const s3 = new aws.S3({apiVersion: '2006-03-01'});
const lambda = new aws.Lambda();


exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    };
    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err);
            const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
            console.log(message);
            callback(message);
        } else {
            const e = data.Body.toString('utf8');
            const lp = {
                FunctionName: 'unicorn',
                Payload: JSON.stringify(e, null, 2) // pass params
            };
            lambda.invoke(lp, function (error, data) {
                if (error) {
                    callback(error);
                }
                console.log("invoked unicorn", lp);
                s3.deleteObject(params, function (err, data) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        callback(null, "OK");
                    }
                });

            });
        }
    });
};
