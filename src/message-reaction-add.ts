import { Client, Emoji, MessageReaction, PartialMessageReaction, PartialUser, User } from 'discord.js';
import { MediaModule } from './types';
import { debugLog } from './logger';

export const onMessageReactionAdd = async (
  client: Client<true>,
  reaction: MessageReaction| PartialMessageReaction,
  user: User | PartialUser,
  mediaModules: MediaModule[],
) => {
  const mediaModule = mediaModules.find((m) => m.submissionsChannelId === reaction.message.channelId);
  if (!mediaModule || !mediaModule.blockOtherReactions) return;

  const debugTag = `[${mediaModule.name}/reaction-add/${reaction.message.id}]`;
  const { guild } = reaction.message;
  if (!guild) {
    debugLog(`${debugTag} Message not in guild`);
    return;
  }

  const moduleEmojis = Object.values(mediaModule.votingEmojis);
  if (reaction.emoji.name && !moduleEmojis.includes(reaction.emoji.name)) {
    debugLog(`${debugTag} Reaction not in module voting emojis, removing "${reaction.emoji.name}"...`);
    await reaction.message.reactions.resolve(reaction.emoji.name)?.users.remove(user.id);
    return;
  }
  if (reaction.emoji.id && !moduleEmojis.includes(reaction.emoji.id)) {
    debugLog(`${debugTag} Reaction not in module voting emojis, removing "${reaction.emoji.id}"...`);
    await reaction.message.reactions.resolve(reaction.emoji.id)?.users.remove(user.id);
    return;
  }
}