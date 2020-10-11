import ws from 'ws';
global.WebSocket = ws;
//require('es6-promise').polyfill();
import 'isomorphic-fetch';

// Require exports file with endpoint and auth info
import aws_exports from './aws-exports.json';
const { region } = aws_exports;
import AWSAppSyncClient from 'aws-appsync';

// If you want to use AWS...
import AWS from 'aws-sdk';
AWS.config.update({
    region
});

import gql from 'graphql-tag';
const query = gql(`
{
allUser(after: null, first: 21) {
    cognitoId
}
}`);

const subquery = gql(`
subscription NewPostSub {
newPost {
    __typename
    id
    title
    author
    version
}
}`);

const client = new AWSAppSyncClient.default({
    ...aws_exports,
    disableOffline: true
});

client.hydrated().then(client => {
    client.query({ query })
        //client.query({ query: query, fetchPolicy: 'network-only' })   //Uncomment for AWS Lambda
        .then(console.log)
        .catch(console.error);

    /*const observable = client.subscribe({ query: subquery });

    const realtimeResults = function realtimeResults(data) {
        console.log('realtime data: ', data);
    };

    observable.subscribe({
        next: realtimeResults,
        complete: console.log,
        error: console.log,
    });*/
});
