import { Client, Message, NewsChannel, PrivateThreadChannel, PublicThreadChannel, StageChannel, TextChannel, VoiceChannel } from 'discord.js';

import { MediaModule } from './types';
import { getCurrentStartEnd } from './prisma';
import { debugLog } from './logger';

/**
 * Fetch all messages in the submissions channel for the current submission period
 * and cache them to memory to receive reactions
 * @param mediaModule The media module to pre-fetch messages for
 * @param client The logged in Discord client
 * @returns A promise that resolves when the messages have been fetched
 */
export const preFetchSubmissionPeriodMessages = async (
  client: Client<true>,
  mediaModule: MediaModule,
): Promise<void> => {
  const debugTag = `[${mediaModule.name}/pre-fetch]`;
  const { submissionsChannelId } = mediaModule;

  debugLog(`${debugTag} Fetching messages for submission period to receive reactions`);

  const submissionsChannel = await client.channels.fetch(submissionsChannelId).catch(() => null);
  if (!submissionsChannel) {
    debugLog(`${debugTag} Submissions channel not found`);
    return;
  }
  if (!submissionsChannel.isTextBased()) {
    debugLog(`${debugTag} Submissions channel not text based`);
    return;
  }
  if (submissionsChannel.isDMBased()) {
    debugLog(`${debugTag} Submissions channel is DM based`);
    return;
  }

  const { currStart, currEnd } = getCurrentStartEnd(
    mediaModule.cronOutputSubmission,
    mediaModule.cronTimezone,
  )

  debugLog(`${debugTag} Fetching messages from ${currStart.toISOString()} to ${currEnd.toISOString()}`);

  // Note: Since this is used to cache the "current" submission period,
  // we don't have to provide an end date and worry about timezones
  const messages = await fetchMessages(submissionsChannel, currStart, new Date(), true);
  debugLog(`${debugTag} Fetched ${messages.size} messages, cached to memory to receive reactions`);
  
  return;
}

export const fetchMessages = async (
  channel: TextChannel | NewsChannel | StageChannel | PrivateThreadChannel | PublicThreadChannel | VoiceChannel,
  start: Date, // Oldest date, fetch messages before this date
  end?: Date, // Newest date, fetch messages after this date
  shouldCache = false
): Promise<Map<string, Message<true>>> => {
  const debugTag = `[${channel.name}/fetch]`;

  const fetchBatch = async (fromMessageId: string | undefined) => {
    const messages = await channel.messages.fetch({
      before: fromMessageId,
      limit: 100,
      cache: shouldCache,
    }).catch((e) => {
      debugLog(`${debugTag} Failed to fetch messages:`, e);
      return null;
    });
    return messages;
  }

  const startVal = start.valueOf();
  const endVal = end?.valueOf() ?? Date.now();

  let fromMessageId: string | undefined = undefined;
  const messages = new Map<string, Message<true>>();

  await new Promise<void>((resolve) => {
    const run = async () => {
      const innerMessages = await fetchBatch(fromMessageId);
      if (innerMessages === null || innerMessages.size === 0) {
        resolve();
        return;
      }
  
      const inTimeFrame = innerMessages.filter((message) => {
        const createdAt = message.createdAt.valueOf();
        return createdAt >= startVal && createdAt <= endVal;
      });
      if (inTimeFrame.size === 0) {
        resolve();
        return;
      }
  
      inTimeFrame.forEach((message) => {
        messages.set(message.id, message);
      });
      fromMessageId = innerMessages.lastKey();

      await run();
    }

    run();
  });

  debugLog(`${debugTag} Fetched ${messages.size} messages`);
  return messages;
}