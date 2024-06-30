export const debugEnabled = process.env.DEBUG_ENABLED === 'true';

export const debugLog = (...args: any[]) => {
  if (debugEnabled) {
    console.debug(...args);
  }
}