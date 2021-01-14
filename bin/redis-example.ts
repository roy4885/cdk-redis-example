#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RedisExampleStack } from '../lib/redis-example-stack';
import { VpcStack } from '../lib/vpc'

const app = new cdk.App();
new VpcStack(app, 'MyVpcStack');
