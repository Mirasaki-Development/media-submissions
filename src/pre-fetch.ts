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

  const submissionsChannel = await client.channels.fetch(submissionsChannelId);
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

  const messages = await fetchMessages(submissionsChannel, currStart, currEnd, true);
  debugLog(`${debugTag} Fetched ${messages.size} messages, cached to memory to receive reactions`);
  
  return;
}

export const fetchMessages = async (
  channel: TextChannel | NewsChannel | StageChannel | PrivateThreadChannel | PublicThreadChannel | VoiceChannel,
  start: Date, // Oldest date, fetch messages before this date
  end: Date, // Newest date, fetch messages after this date
  shouldCache = false
): Promise<Map<string, Message<true>>> => {
  const debugTag = `[${channel.name}/fetch]`;

  const fetchBatch = async (fromMessageId: string | undefined) => {
    const messages = await channel.messages.fetch({
      before: fromMessageId,
      limit: 100,
      cache: shouldCache,
    });
    return messages;
  }

  const startVal = start.valueOf();
  const endVal = end.valueOf();

  let fromMessageId: string | undefined = undefined;
  const messages = new Map<string, Message<true>>();
  while (true) {
    const messages = await fetchBatch(fromMessageId);
    if (messages.size === 0) {
      break;
    }

    const inTimeFrame = messages.filter((message) => {
      const createdAt = message.createdAt.valueOf();
      return createdAt >= startVal && createdAt <= endVal;
    });
    if (inTimeFrame.size === 0) {
      break;
    }

    inTimeFrame.forEach((message) => {
      messages.set(message.id, message);
    });
    fromMessageId = messages.lastKey();
  }

  debugLog(`${debugTag} Fetched ${messages.size} messages`);
  return messages;
}