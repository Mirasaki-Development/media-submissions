import { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import { appConfig } from '../config';

export const prisma = new PrismaClient();

export const getCurrentStartEnd = (cronExpression: string, cronTimezone: string) => {
  const ghostJob = new CronJob(
    cronExpression,
    () => {},
    null,
    false,
    cronTimezone,
  );

  const nextDates = ghostJob.nextDates(2);
  const diff = nextDates[1].toJSDate().getTime() - nextDates[0].toJSDate().getTime();
  const currStart = new Date(nextDates[0].toJSDate().getTime() - diff);
  const currEnd = nextDates[0].toJSDate();

  return {
    currStart,
    currEnd,
  };
}


export const getUserSubmissions = async (
  mediaModuleId: string,
  userId: string,
  channelId: string,
  guildId: string,
) => {
  const mediaModule = appConfig.mediaModules.find((module) => module.id === mediaModuleId);
  if (!mediaModule) {
    return [];
  }

  const { currStart, currEnd } = getCurrentStartEnd(
    mediaModule.cronOutputSubmission,
    mediaModule.cronTimezone
  );

  return prisma.submission.findMany({
    where: {
      mediaModuleId,
      userId,
      channelId,
      guildId,
      createdAt: {
        gte: currStart,
        lt: currEnd,
      }
    },
  });
}

export const countSubmissions = async (
  mediaModuleId: string,
  channelId: string,
  guildId: string,
) => {
  const mediaModule = appConfig.mediaModules.find((module) => module.id === mediaModuleId);
  if (!mediaModule) {
    return 0;
  }

  const { currStart, currEnd } = getCurrentStartEnd(
    mediaModule.cronOutputSubmission,
    mediaModule.cronTimezone
  );

  return prisma.submission.count({
    where: {
      mediaModuleId,
      channelId,
      guildId,
      createdAt: {
        gte: currStart,
        lt: currEnd,
      }
    },
  });
}