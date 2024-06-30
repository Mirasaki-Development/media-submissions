import { AppConfig } from './src/types';

import {
  discordMediaSource,
  imgurMediaSource,
  medalMediaSource,
  youtubeMediaSource,
} from './src/media-sources';
import { ThreadAutoArchiveDuration } from 'discord.js';

// Note: Don't forget to update your timezone: https://momentjs.com/timezone/
export const myTimezone = 'America/New_York';

export const dailyCron = '0 0 * * *';
export const weeklyCron = '0 0 * * 1';
export const monthlyCron = '0 0 1 * *';
export const yearlyCron = '0 0 1 1 *';

// Note: Please check our guide if you're unsure how to obtain the channel IDs:
// https://wiki.mirasaki.dev/docs/discord-developer-mode

export const appConfig: AppConfig = {
  mediaModules: [
    {
      id: 'cotw',
      name: '📹 Clip of the Week',
      type: 'video',
      submissionsChannelId: '', // Provide your submissions channel ID here
      submissionsOutputChannelId: '', // Provide your submissions output channel ID here
      cronOutputSubmission: weeklyCron,
      cronTimezone: myTimezone,
      votingEmojis: {
        upvote: '👍',
        downvote: '👎',
      },
      deleteNonSubmissions: true,
      allowedSources: [
        discordMediaSource,
        imgurMediaSource,
        medalMediaSource,
        youtubeMediaSource,
      ],
      submissionCooldown: 60 * 60, // 1 hour = 60 seconds * 60 minutes
      quantities: {
        maxSubmissions: null,
        maxSubmissionsPerUser: 1,
        attachmentsPerSubmission: 1,
      },
      submissionThread: {
        enabled: true,
        name: 'Clip of the Week Feedback',
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        rateLimitPerUser: null,
      },
    },
    {
      id: 'potw',
      name: '🖼️ Picture of the Week',
      type: 'image',
      submissionsChannelId: '', // Provide your submissions channel ID here
      submissionsOutputChannelId: '', // Provide your submissions output channel ID here
      cronOutputSubmission: weeklyCron,
      cronTimezone: myTimezone,
      votingEmojis: {
        upvote: '👍',
        downvote: '👎',
      },
      deleteNonSubmissions: true,
      allowedSources: [
        discordMediaSource,
        imgurMediaSource,
      ],
      submissionCooldown: 60 * 60, // 1 hour = 60 seconds * 60 minutes
      quantities: {
        maxSubmissions: null,
        maxSubmissionsPerUser: 1,
        attachmentsPerSubmission: 1,
      },
      submissionThread: {
        enabled: true,
        name: 'Picture of the Week Feedback',
        autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
        rateLimitPerUser: null,
      },
    }
  ],
};

