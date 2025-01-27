export const RATE_LIMIT_THRESHOLDS_PER_MINUTE = {
  COINGECKO: 50, // https://www.coingecko.com/en/api/documentation
  COINCAP: 200, // https://docs.coincap.io/ limits->free tier
  DEFAULT: 300 // default for services
}

export const DEFAULT_RATE_LIMITER_INTERVAL_IN_MS = 60000
