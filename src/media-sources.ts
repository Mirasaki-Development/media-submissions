import { MediaSource } from './types'

export const discordMediaSource: MediaSource = {
  name: 'Discord',
  validationURL: 'attachment',
}

export const imgurMediaSource: MediaSource = {
  name: 'Imgur',
  validationURL: 'https://imgur.com/gallery/{id}',
}

export const medalMediaSource: MediaSource = {
  name: 'Medal',
  validationURL: 'https://medal.tv/clips/{id}',
}

export const youtubeMediaSource: MediaSource = {
  name: 'Youtube',
  validationURL: 'https://www.youtube.com/watch?v={id}',
}

export const defaultMediaSources: MediaSource[] = [
  discordMediaSource,
  imgurMediaSource,
  medalMediaSource,
  youtubeMediaSource,
]