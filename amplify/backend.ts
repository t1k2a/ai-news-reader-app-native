import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { myFirstFunction } from './functions/my-first-function/resource';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  myFirstFunction,
});

// Lambda関数URLを有効化（認証なしで公開）
const myFunctionUrl = backend.myFirstFunction.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [cdk.aws_lambda.HttpMethod.ALL],
    allowedHeaders: ['*'],
  },
});

// 関数URLを出力に追加
backend.addOutput({
  custom: {
    myFunctionUrl: myFunctionUrl.url,
  },
});
