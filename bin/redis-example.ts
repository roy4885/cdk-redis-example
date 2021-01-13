#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { RedisExampleStack } from '../lib/redis-example-stack';

const app = new cdk.App();
new RedisExampleStack(app, 'RedisExampleStack');
