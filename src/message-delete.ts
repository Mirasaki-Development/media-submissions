import { Client, Message, PartialMessage } from 'discord.js';
import { isMediaSubmission } from './message-create';
import { MediaModule } from './types';
import { prisma } from './prisma';
import { debugLog } from './logger';

export const onMessageDelete = async (
  client: Client<true>,
  message: Message | PartialMessage,
  mediaModules: MediaModule[],
) => {
  const mediaModule = isMediaSubmission(message, mediaModules);
  if (!mediaModule) return;

  const debugTag = `[${mediaModule.name}/delete/${message.id}]`;
  const submission = await prisma.submission.findFirst({
    where: {
      messageId: message.id,
    },
  });

  if (!submission) {
    debugLog(`${debugTag} Submission not found`);
    return;
  }

  await prisma.submission.delete({
    where: {
      id: submission.id,
    },
  });

  debugLog(`${debugTag} Submission deleted`);
}