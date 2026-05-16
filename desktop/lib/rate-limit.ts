import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { env } from "@/lib/env";

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  if (bucket.count >= limit) {
    return { success: false };
  }
  bucket.count += 1;
  return { success: true };
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();

function createLimiter(prefix: string, requests: number, window: `${number} s` | `${number} m`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `vyb:${prefix}`,
  });
}

const limiters = {
  post: createLimiter("post", 20, "1 m"),
  comment: createLimiter("comment", 40, "1 m"),
  search: createLimiter("search", 60, "1 m"),
  auth: createLimiter("auth", 30, "1 m"),
};

export async function rateLimit(
  bucket: keyof typeof limiters,
  identifier: string,
  fallback: { limit: number; windowMs: number },
) {
  const limiter = limiters[bucket];
  if (limiter) {
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  }
  const key = `${bucket}:${identifier}`;
  return memoryLimit(key, fallback.limit, fallback.windowMs);
}

export function hasUpstash() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

void env;
