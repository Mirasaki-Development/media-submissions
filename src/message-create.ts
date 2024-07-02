import { ChannelType, Client, Message, MessageCreateOptions, PartialMessage } from 'discord.js';
import { MediaModule } from './types';
import { debugLog } from './logger';
import { countSubmissions, getUserSubmissions, prisma } from './prisma';
import { messageHasMediaSource } from './media-sources';

export const tryToDMUser = async (
  message: Message,
  options: MessageCreateOptions,
): Promise<void> => {
  const { author } = message;
  try {
    const dm = await author.createDM();
    await dm.send(options);
  } catch (e) {
    debugLog(`Failed to DM user ${author.id}:`, e);
  }
}

export const validateSubmissionMediaSources = async (
  message: Message,
  mediaModule: MediaModule,
  onBadSource: () => void,
): Promise<boolean> => {
  const { attachments } = message;
  const {
    name,
    type,
    allowedSources,
    quantities,
  } = mediaModule;
  const debugTag = `[${name}/${message.id}]`;

  if ( // Ensure submission source is present and allowed
    !messageHasMediaSource(message.content, allowedSources, quantities.attachmentsPerSubmission)
    && (!allowedSources.find((e) => e.validationURL === 'attachment') || attachments.size === 0)
  ) {
    debugLog(`${debugTag} Invalid media source`);
    tryToDMUser(message, {
      content: `Your submission in ${message.channel} was removed because it did not contain a valid media source. Please ensure your submission contains at least one of the following:\n\n${allowedSources.map((source) => `- ${source.name}`).join('\n')}`,
    });
    onBadSource();
    return false;
  }

  // Validate URL content type
  const urls = message.content.split(' ').filter((word) => word.startsWith('http'));
  if (urls.length >= 1) {
    const fetchURL = (url: string) => fetch(url).then((res) => res.blob()).then((blob) => blob.type);
    for await (const url of urls) { // One by one, escape if invalid
      const contentType = await fetchURL(url);
      console.log('contentType', contentType + ' for ' + url)
      if (type === 'image' && !contentType.startsWith('image/')) {
        debugLog(`${debugTag} Invalid image URL: ${url} (${contentType})`);
        tryToDMUser(message, {
          content: `Your submission in ${message.channel} was removed because it did not contain a valid image URL. Please ensure your submission contains a valid image URL.`,
        });
        onBadSource();
        return false;
      }
      if (type === 'video' && !contentType.startsWith('video/')) {
        debugLog(`${debugTag} Invalid video URL: ${url} (${contentType})`);
        tryToDMUser(message, {
          content: `Your submission in ${message.channel} was removed because it did not contain a valid video URL. Please ensure your submission contains a valid video URL.`,
        });
        onBadSource();
        return false;
      }
      if (type === 'either' && !contentType.startsWith('image/') && !contentType.startsWith('video/')) {
        debugLog(`${debugTag} Invalid media URL: ${url} (${contentType})`);
        tryToDMUser(message, {
          content: `Your submission in ${message.channel} was removed because it did not contain a valid media URL. Please ensure your submission contains a valid media URL.`,
        });
        onBadSource();
        return false;
      }
    }
  }

  if ( // Ensure submission has the correct amount of attachments
    quantities.attachmentsPerSubmission !== null
    && attachments.size > quantities.attachmentsPerSubmission
  ) {
    debugLog(`${debugTag} Too many attachments`);
    tryToDMUser(message, {
      content: `Your submission in ${message.channel} was removed because it contained too many attachments. Please ensure your submission contains no more than ${quantities.attachmentsPerSubmission} attachments.`,
    });
    onBadSource();
    return false;
  }

  if (attachments.size) { // Ensure attachments are of allowed sources
    const invalidAttachments = [...attachments.values()].filter((attachment) => {
      if (type === 'image') {
        return attachment.contentType?.startsWith('image/') === false;
      }
      if (type === 'video') {
        return attachment.contentType?.startsWith('video/') === false;
      }
      return attachment.contentType?.startsWith('image/') === false && attachment.contentType?.startsWith('video/') === false;
    });

    if (invalidAttachments.length) {
      debugLog(`${debugTag} Invalid attachments:`, invalidAttachments.map((attachment) => `${attachment.url} (${attachment.contentType})`));
      tryToDMUser(message, {
        content: `Your submission in ${message.channel} was removed because it contained invalid attachments. Please ensure your submission contains only valid attachments.`,
      });
      onBadSource();
      return false;
    }
  }

  return true;
}

export const honorSubmissionQuantityLimits = async (
  mediaModule: MediaModule,
  message: Message,
  quantities: MediaModule['quantities'],
  submissionCooldown: number | null,
  conditionalDelete: () => void,
  debugTag: string,
): Promise<boolean> => {
  const { author, channel, guild } = message;
  if (!guild) return false;
  const [
    userSubmissions,
    moduleSubmissionCount,
  ] = await Promise.all([
    getUserSubmissions(mediaModule.id, author.id, channel.id, guild.id),
    countSubmissions(mediaModule.id, channel.id, guild.id)
  ]);

  if ( // Ensure submission quantities are within limits
    quantities.maxSubmissions !== null
    && moduleSubmissionCount >= quantities.maxSubmissions
  ) {
    debugLog(`${debugTag} Too many submissions for module`);
    tryToDMUser(message, {
      content: `Your submission in ${channel} was removed because the module has reached its submission limit. Please try again later.`,
    });
    conditionalDelete();
    return false;
  }
  
  if ( // Ensure user submission quantities are within limits
    quantities.maxSubmissionsPerUser !== null
    && userSubmissions.length >= quantities.maxSubmissionsPerUser
  ) {
    debugLog(`${debugTag} Too many submissions for user`);
    tryToDMUser(message, {
      content: `Your submission in ${channel} was removed because you have reached your submission limit. Please try again later.`,
    });
    conditionalDelete();
    return false;
  }

  // Ensure user is not on cooldown
  const latestSubmission = userSubmissions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  if (submissionCooldown && latestSubmission) {
    const timeSinceLastSubmission = (Date.now() - latestSubmission.createdAt.getTime()) / 1000;
    if (timeSinceLastSubmission < submissionCooldown) {
      debugLog(`${debugTag} User on cooldown`);
      tryToDMUser(message, {
        content: `Your submission in ${channel} was removed because you are on cooldown. Please try again in ${Math.ceil(submissionCooldown - timeSinceLastSubmission)} seconds.`,
      });
      conditionalDelete();
      return false;
    }
  }

  return true;
}

export const onMessageCreate = async (
  client: Client<true>,
  message: Message,
  mediaModules: MediaModule[],
): Promise<void> => {
  if (message.author.bot) return;

  const mediaModule = isMediaSubmission(message, mediaModules);
  if (!mediaModule) return;
  
  const debugTag = `[${mediaModule.name}/${message.id}]`;
  const { author, channel, guild } = message;
  const {
    submissionCooldown,
    deleteNonSubmissions,
    quantities,
    votingEmojis,
    submissionThread,
  } = mediaModule;

  if (!guild) {
    debugLog(`${debugTag} Message not in guild`);
    return;
  }

  if (channel.isDMBased()) {
    debugLog(`${debugTag} Message in DM channel`);
    return;
  }

  if (!channel.isTextBased()) {
    debugLog(`${debugTag} Message not in text channel`);
    return;
  }

  if (channel.isThread()) {
    debugLog(`${debugTag} Message in thread channel`);
    return;
  }

  if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
    debugLog(`${debugTag} Message in voice channel`);
    return;
  }

  const conditionalDelete = () => {
    if (deleteNonSubmissions) {
      message.delete().catch((e) => {
        debugLog(`${debugTag} Failed to delete message:`, e);
      });
    }
  }

  // Validate media sources
  if (!await validateSubmissionMediaSources(message, mediaModule, conditionalDelete)) {
    return; // Submission has invalid media source(s) and was deleted
  }

  // Make sure we don't exceed submission quantity limits
  await honorSubmissionQuantityLimits(
    mediaModule,
    message,
    quantities,
    submissionCooldown,
    conditionalDelete,
    debugTag,
  );

  // Everything is okay, let's do the thing =)
  await Promise.all([
    prisma.submission.create({
      data: {
        mediaModuleId: mediaModule.id,
        userId: author.id,
        guildId: guild.id,
        messageId: message.id,
        channelId: channel.id,
        processed: false,
        processedAt: null,
        cooldownExpiresAt: submissionCooldown ? new Date(Date.now() + submissionCooldown * 1000) : null,
      },
    }),
    message.react(votingEmojis.upvote).then(() => message.react(votingEmojis.downvote)).catch((e) => {
      debugLog(`${debugTag} Failed to react to message:`, e);
    }),
    submissionThread.enabled ? channel.threads.create({
      name: submissionThread.name,
      autoArchiveDuration: submissionThread.autoArchiveDuration ?? undefined,
      startMessage: message,
      reason: 'Submission feedback thread for organized discussion/feedback.',
      rateLimitPerUser: submissionThread.rateLimitPerUser ?? undefined,
    }).catch((e) => {
      debugLog(`${debugTag} Failed to create thread:`, e);
    }) : Promise.resolve(),
  ])

}

export const isMediaSubmission = (
  message: Message | PartialMessage,
  mediaModules: MediaModule[],
): false | MediaModule => {
  const module = mediaModules.find((module) => module.submissionsChannelId === message.channel.id);
  return module ?? false;
}