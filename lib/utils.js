import crypto from 'crypto';

/**
 * genCacheKey()
 */
const genCacheKey = (str) => {    
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex')
}

/** 
 * key2path()
 * convert a key into a 3-level directory path
 */
const cacheKey2path = (key) => {
    const one = key.substring(0, 1);
    const two = key.substring(0, 2);
    const thr = key.substring(0, 3);
    return `${one}/${two}/${thr}`;
}

const cacheKeyFile = (dir, key) => {
    const cacheKey = genCacheKey(key)
    const filepath = cacheKey2path(cacheKey);
    return `${dir}/${filepath}/${cacheKey}.json`;
}

export { cacheKeyFile }
export * as sync from './sync-functions.js';