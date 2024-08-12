import { MediaSource } from './types'

export const discordMediaSource: MediaSource = {
  name: 'Discord',
  validationURLs: [ 'attachment' ],
}

export const imgurMediaSource: MediaSource = {
  name: 'Imgur',
  validationURLs: [ 'https://imgur.com/gallery/' ],
}

export const medalMediaSource: MediaSource = {
  name: 'Medal',
  validationURLs: [ 'https://medal.tv/' ],
}

export const youtubeMediaSource: MediaSource = {
  name: 'Youtube',
  validationURLs: [ 'https://www.youtube.com/watch?v=', 'https://youtu.be/' ],
}

export const defaultMediaSources: MediaSource[] = [
  discordMediaSource,
  imgurMediaSource,
  medalMediaSource,
  youtubeMediaSource,
]

export const getMediaSourceByName = (name: string): MediaSource | undefined => {
  return defaultMediaSources.find((source) => source.name === name)
}

export const discordAttachmentSources = [
  'cdn.discordapp.com/attachments/',
  'media.discordapp.net/attachments/',
  'media.discordapp.net/external/',
]

export const messageHasMediaSource = (
  message: string,
  mediaSources: MediaSource[],
  quantity: number | null,
): MediaSource | MediaSource[] | false => {
  if (quantity !== null) {
    const urls = message.split(' ').filter((word) => word.includes('http'))
    const validSources = urls.map((url) => mediaSources.find((source) => {
      return source.validationURLs.some((validationURL) => {
        if (validationURL === 'attachment') return discordAttachmentSources.some((attachmentSource) => url.includes(attachmentSource))
        return url.includes(validationURL)
      })
    }))
    const uniqueSources = [...new Set(validSources)] as MediaSource[]
    if (uniqueSources.length > quantity) return false;
    return uniqueSources.length === 0
      ? false
      : uniqueSources.length === 1
        ? uniqueSources[0]
        : uniqueSources
  }

  return mediaSources.find((source) => {
    return source.validationURLs.some((validationURL) => {
      if (validationURL === 'attachment') return discordAttachmentSources.some((attachmentSource) => message.includes(attachmentSource))
      return message.includes(validationURL)
    });
  }) ?? false
}