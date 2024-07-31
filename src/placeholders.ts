import { Message, PartialMessage } from 'discord.js';
import { MediaModule } from './types';
import { Submission } from '@prisma/client';

export type Placeholders = {
  name: string;
  date: string;
  time: string;
  author: string;
  id: string;
  channel: string;
  link: string;
  upvotes: string;
  downvotes: string;
};

export const buildPlaceholders = async (
  mediaModule: MediaModule,
  submission: Submission,
  date: Date,
  message: Message<true> | PartialMessage,
): Promise<null | Placeholders> => {
  const resolvedMessage: Message<true> | null = message.partial
    ? await message.fetch().catch(() => null) as Message<true> | null
    : await Promise.resolve(message);
  if (!resolvedMessage) {
    return null;
  }
  return {
    name: mediaModule.name,
    date: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
    time: `${date.getHours()}h${date.getMinutes()}`,
    author: resolvedMessage.author.username,
    id: `${submission.id}`,
    channel: resolvedMessage.channel.name,
    link: resolvedMessage.url,
    upvotes: message.reactions.cache.get(mediaModule.votingEmojis.upvote)?.count.toString() ?? '0',
    downvotes: message.reactions.cache.get(mediaModule.votingEmojis.downvote)?.count.toString() ?? '0',
  }
}

export const replacePlaceholders = (content: string, placeholders: Record<string, string>): string => {
  return Object.entries(placeholders).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{${key}}`, 'g'), value)
  }, content)
}