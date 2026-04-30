type RateLimiterConfig = {
  limit: number;
  windowMs: number;
};

class InMemoryRateLimiter {
  private map = new Map<string, number[]>();
  private readonly limitCount: number;
  private readonly windowMs: number;

  constructor(config: RateLimiterConfig) {
    this.limitCount = config.limit;
    this.windowMs = config.windowMs;
  }

  async limit(key: string) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const history = (this.map.get(key) ?? []).filter((time) => time > windowStart);

    if (history.length >= this.limitCount) {
      this.map.set(key, history);
      return { success: false };
    }

    history.push(now);
    this.map.set(key, history);
    return { success: true };
  }
}

export const chatRateLimiter = new InMemoryRateLimiter({ limit: 30, windowMs: 60_000 });
export const loginRateLimiter = new InMemoryRateLimiter({ limit: 5, windowMs: 60_000 });
export const uploadRateLimiter = new InMemoryRateLimiter({ limit: 10, windowMs: 60_000 });
