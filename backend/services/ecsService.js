import {
  ECSClient,
  RunTaskCommand,
  DescribeTasksCommand,
  StopTaskCommand,
} from "@aws-sdk/client-ecs";
import {
  EC2Client,
  DescribeNetworkInterfacesCommand,
} from "@aws-sdk/client-ec2";
import { ENV } from "../config/env.js";
import { getLabById } from "../config/labs.js";
import { canonicalLabType } from "../lib/labTypeMapper.js";
import { getContainerPort } from "../lib/labTools.js";

const ecsClient = new ECSClient({ region: ENV.awsRegion });
const ec2Client = new EC2Client({ region: ENV.awsRegion });

export const isEcsEnabled = () => Boolean(ENV.ecsCluster);

const getEniPrivateIp = (task) => {
  for (const att of task.attachments || []) {
    if (att.type !== "ElasticNetworkInterface") continue;
    for (const d of att.details || []) {
      if (d.name === "privateIPv4Address") return d.value;
    }
  }
  return null;
};

export const getTaskPublicIp = async (taskArn) => {
  const taskDetails = await ecsClient.send(
    new DescribeTasksCommand({ cluster: ENV.ecsCluster, tasks: [taskArn] }),
  );
  const task = taskDetails.tasks?.[0];
  if (!task) return null;

  const eniId = task.attachments
    ?.find((a) => a.type === "ElasticNetworkInterface")
    ?.details?.find((d) => d.name === "networkInterfaceId")?.value;

  if (!eniId) return null;

  const eniDetails = await ec2Client.send(
    new DescribeNetworkInterfacesCommand({ NetworkInterfaceIds: [eniId] }),
  );
  return eniDetails.NetworkInterfaces?.[0]?.Association?.PublicIp || null;
};

export const describeTask = async (taskArn) => {
  const res = await ecsClient.send(
    new DescribeTasksCommand({ cluster: ENV.ecsCluster, tasks: [taskArn] }),
  );
  return res.tasks?.[0] || null;
};

export const resolveTaskNetworking = async (taskArn, labId) => {
  const task = await describeTask(taskArn);
  if (!task) return { status: "starting" };

  if (task.lastStatus === "STOPPED") {
    return { status: "failed", message: task.stoppedReason || "Container stopped" };
  }

  if (task.lastStatus !== "RUNNING") {
    return { status: "starting" };
  }

  const taskPrivateIp = getEniPrivateIp(task);
  const publicIp = await getTaskPublicIp(taskArn);
  const port = getContainerPort(labId);

  return {
    status: "running",
    taskPrivateIp,
    publicIp,
    taskPort: port,
    startedAt: new Date().toISOString(),
    message: "Lab environment is ready",
  };
};

export const startEcsTask = async ({ labId, sessionId, sessionToken }) => {
  const lab = getLabById(labId);
  const labType = canonicalLabType(labId);
  const taskDefinition = lab?.taskDefinition;

  if (!taskDefinition) {
    throw new Error(`No ECS task definition for lab: ${labId}`);
  }

  const port = getContainerPort(labId);
  const environment = [
    { name: "SESSION_ID", value: sessionId },
    { name: "SESSION_TOKEN", value: sessionToken },
    { name: "LAB_TYPE", value: labType },
    { name: "LAB_SERVER_PORT", value: String(port) },
    { name: "LAB_WORKSPACE", value: "/workspace" },
  ];

  const response = await ecsClient.send(
    new RunTaskCommand({
      cluster: ENV.ecsCluster,
      taskDefinition,
      launchType: "FARGATE",
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: ENV.ecsSubnets,
          securityGroups: ENV.ecsSecurityGroups,
          assignPublicIp: "ENABLED",
        },
      },
      overrides: {
        containerOverrides: [
          {
            name: "lab-runtime",
            environment,
          },
        ],
      },
    }),
  );

  const taskArn = response.tasks?.[0]?.taskArn;
  if (!taskArn) throw new Error("ECS failed to start task");
  return { taskArn, labType, taskPort: port };
};

export const stopEcsTask = async (taskArn) => {
  await ecsClient.send(
    new StopTaskCommand({
      cluster: ENV.ecsCluster,
      task: taskArn,
      reason: "User requested stop",
    }),
  );
};
