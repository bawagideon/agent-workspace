import { RateLimiterProxy } from './RateLimiterProxy';
const proxy = new RateLimiterProxy();
if (!proxy.allowRequest()) throw new Error('Rate limit failure');
console.log('RATE_LIMITER_TEST_PASSED');
