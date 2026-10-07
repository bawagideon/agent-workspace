// Shared memory cache for LinkedIn OAuth state CSRF tokens (5 minute TTL)
export const oauthStateCache = new Map<string, number>();
