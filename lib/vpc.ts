import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import { CfnOutput } from '@aws-cdk/core';
import * as elasticache from '@aws-cdk/aws-elasticache';

export class VpcStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'redis-vpc', {
            maxAzs: 2,
            natGateways: 1
        });

        new CfnOutput(this, 'myvpc', { value: vpc.vpcId});
        new CfnOutput(this, 'cidr', { value: vpc.vpcCidrBlock})
        new CfnOutput(this, 'privateSubnets', { value: vpc.privateSubnets.toString()})

        const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'redis-subnet-group', {
            cacheSubnetGroupName: 'redis-subnet-group',
            description: 'The redis subnet group id',
            subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId)
        });

        // The security group that defines network level access to the cluster
        const redisSecurityGroup = new ec2.SecurityGroup(this, 'redis-security-group', { vpc: vpc });

        const redisConnections = new ec2.Connections({
            securityGroups: [redisSecurityGroup],
            defaultPort: ec2.Port.tcp(6379)
        });

        const redis = new elasticache.CfnCacheCluster(this, 'redis', {
            cacheNodeType:'cache.t2.micro',
            engine: 'redis',
            engineVersion: '6.x',
            numCacheNodes: 1,
            port: 6379,
            cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
            vpcSecurityGroupIds: [ redisSecurityGroup.securityGroupId ]
        });
        redis.addDependsOn(redisSubnetGroup);

        new CfnOutput(this, 'redisUrl', { value: redis.attrRedisEndpointAddress});
        new CfnOutput(this, 'redisPort', { value: redis.attrRedisEndpointPort});

        const redisCluster = new elasticache.CfnReplicationGroup(this, 'redis-cluster', {
            cacheNodeType:'cache.t2.micro',
            engine: 'redis',
            cacheParameterGroupName: 'default.redis6.x.cluster.on',
            engineVersion: '6.x',
            numNodeGroups: 1,
            replicasPerNodeGroup: 1,
            port: 6379,
            cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
            replicationGroupDescription: 'redis cluster mode on',
            securityGroupIds: [redisSecurityGroup.securityGroupId]
        });
        redisCluster.addDependsOn(redisSubnetGroup);

        new CfnOutput(this, 'redisClusterPrimaryUrl', { value: redisCluster.attrPrimaryEndPointAddress});
        new CfnOutput(this, 'redisClusterPrimaryPort', { value: redisCluster.attrPrimaryEndPointPort});
        new CfnOutput(this, 'redisClusterReadUrl', { value: redisCluster.attrReadEndPointAddresses});
        new CfnOutput(this, 'redisClusterReadPort', { value: redisCluster.attrReadEndPointPorts});
        

    }
}