export class RateLimiterProxy {
  private tokens: number = 100;
  public allowRequest(): boolean {
    if (this.tokens > 0) { this.tokens--; return true; }
    return false;
  }
}
