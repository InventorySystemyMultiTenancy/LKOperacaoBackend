const cacheStore = new Map();

const buildCacheKey = (req) => {
  const usuario = req.usuario
    ? `${req.usuario.id || "sem-id"}:${req.usuario.role || "sem-role"}`
    : "anon";

  return `${req.method}:${usuario}:${req.originalUrl}`;
};

const getFromCache = (key) => {
  const item = cacheStore.get(key);

  if (!item) {
    return null;
  }

  if (item.expiresAt <= Date.now()) {
    cacheStore.delete(key);
    return null;
  }

  return item;
};

export const cacheGet = ({ ttlSeconds = 20, bypassQueryParam = "fresh" } = {}) => {
  return (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    if (req.query?.[bypassQueryParam] === "true") {
      return next();
    }

    const key = buildCacheKey(req);
    const cached = getFromCache(key);

    if (cached) {
      res.set("X-Cache", "HIT");
      return res.status(cached.statusCode).json(cached.payload);
    }

    const originalJson = res.json.bind(res);

    res.json = (payload) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheStore.set(key, {
          statusCode: res.statusCode,
          payload,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });

        res.set("X-Cache", "MISS");
      }

      return originalJson(payload);
    };

    return next();
  };
};

export const clearHttpCache = () => {
  cacheStore.clear();
};

export const clearHttpCacheOnSuccess = () => {
  return (req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        clearHttpCache();
      }
    });

    next();
  };
};
