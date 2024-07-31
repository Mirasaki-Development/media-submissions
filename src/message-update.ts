import { Client, Message, PartialMessage } from 'discord.js';
import { isMediaSubmission, validateSubmissionMediaSources } from './message-create';
import { MediaModule } from './types';
import { prisma } from './prisma';
import { debugLog } from './logger';

export const onMessageUpdate = async (
  client: Client<true>,
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage,
  mediaModules: MediaModule[],
) => {
  const mediaModule = isMediaSubmission(newMessage, mediaModules);
  if (!mediaModule) return;

  const debugTag = `[${mediaModule.name}/update/${newMessage.id}]`;
  const submission = await prisma.submission.findFirst({
    where: {
      messageId: newMessage.id,
    },
  });

  if (!submission) {
    debugLog(`${debugTag} Submission not found`);
    return;
  }

  const message = await newMessage.fetch().catch(() => null);
  if (!message) {
    debugLog(`${debugTag} Unresolved message, skipping...`);
    return;
  }

  const conditionalDelete = async () => {
    if (mediaModule.deleteNonSubmissions) {
      message.delete().catch((e) => {
        debugLog(`${debugTag} Failed to delete message:`, e);
      });
    }
    await prisma.submission.delete({
      where: {
        id: submission.id,
      },
    });
  }

  // Re-validate media sources, and delete submission if invalid
  await validateSubmissionMediaSources(message, mediaModule, conditionalDelete)
}