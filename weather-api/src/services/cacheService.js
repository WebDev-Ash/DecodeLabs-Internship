class CacheService {
  constructor(ttl = 300000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  _generateKey(...args) {
    return args.map(arg => JSON.stringify(arg)).join('|');
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

const cacheTTL = process.env.CACHE_TTL ? Number(process.env.CACHE_TTL) : 300000;
const cache = new CacheService(cacheTTL);

module.exports = { cache };
