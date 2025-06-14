import fs from 'node:fs/promises';
import path from 'path';
import { generateEmbedding, calculateSimilarity } from './lib/similarity.js';
import { isExpired, walkDir, mkdir, genPaths, exists } from './lib/utils.js';
/**
* Create a cache 
* @param {Object} opts - Configuration options for the cache
* @param {integer} opts.maxSize - Max entries in the cache (100)
* @param {number} opts.similarityThreshold - Semantic similarity threshold (0.9)
* @param {integer} opts.ttl - Time to live in ms (default 1 day)
* @param {string} opts.dir - Basedir for the cache ('./cache')
* @param {string} opts.segment - Cache segment ('default')
* @returns {Object} - Cache API object
* const cache = new Cache(
*      { 
*          dir: './'
*          name: 'cache',
*          segment: 'default',
*          ttl: 1 * 24 * 60 * 60 * 1000, 
*          similarityThreshold: 0.9
*      });
* The following methods are available
* 
* =================================================================
* method   | description
* -----------------------------------------------------------------
* get      | get(query, isSemantic) retrieves query from cache
* set      | set(query, response, isSemantic) sets query to val in cache 
* has      | has(query) returns true if key exists in cache
* rm       | rm(query) removes key from cache
* del      | del(query) -> synonym for rm
* delete   | delete(key) -> synonym for rm
* prune    | prune() removes expired queries
* queries  | queries() lists all the queries in the cache
* has      | has(query) return true or false
* ================================================================= 
*/
class Cache {
    constructor(opts = {}) {

        // Configuration option defaults
        const config = {
            dir: './cache',
            segment: 'default',

            //   d      h     m       s     ms
            //   ▲      ▲     ▲       ▲      ▲
            //   │      │     │       │      │
            ttl: 1  *  24  *  60  *  60 *  1000,
            similarityThreshold: 0.9
        };

        this.config = {}
        Object.assign(this.config, config,  opts);
    }

    // Ensure cache directory exists
    async init() {
        await mkdir(this.config.dir)
    }

    async get(obj) {
        let segment;
        let query;
        let isSemantic;

        if (!obj || !obj.query) {

            if (!query) {
                console.error("error: 'query' is required to GET its value");
                return false;
            }

        }
        else {
            segment = obj.segment ?? this.config.segment;
            isSemantic = obj.isSemantic ?? false;
            query = obj.query;
        }

        // First, check if there is an exact query. 
        // Note: This will match plain as well as semantic 
        // queries because it looks for the exact key
        let cachedData = await this.#get(segment, query);
        if (cachedData) return cachedData;

        // If we reach here, no exact query found, 
        // so check for semantically similary queries
        if (isSemantic) {
            cachedData = await this.#getSem(segment, query);
            if (cachedData) return cachedData;
        }
        
        // Nothing found
        return false;
    }

    async #get(segment, query) {
        
        const { filepath, filename } = genPaths({
            dir: this.config.dir, 
            segment, 
            query
        });

        const cacheFile = path.join(filepath, filename);

        if (await exists(cacheFile)) {
            const data = await fs.readFile(cacheFile, 'utf8');
            const entry = JSON.parse(data);
            
            // Check TTL
            if (isExpired(entry)) {
                await this.rm({ segment, query });
                return false;
            }

            return entry;
        }

    }

    async #getSem(segment, query) {

        // There is no exact match, so let's check for similar queries
        const srcEmbedding = await generateEmbedding(query);
        let bestMatch;
        let highestSimilarity = 0;
            
        const cb = async (file) => {
            try {
                const data = await fs.readFile(file, 'utf8');
                const entry = JSON.parse(data);
                const query = entry.query;
                
                // Check TTL
                if (isExpired(entry)) {
                    await this.rm({ segment, query, isSemantic: true });
                    return false;
                }

                const tgtEmbedding = await generateEmbedding(query);

                // Only similarity > similarityThreshold will be 
                // returned
                const similarity = calculateSimilarity(
                    srcEmbedding, 
                    tgtEmbedding,
                    this.config.similarityThreshold
                );

                // Remember the highestSimilarity
                if (similarity && (similarity > highestSimilarity)) {
                    highestSimilarity = similarity;
                    bestMatch = entry;
                }

            } 

            /* c8 ignore start */
            catch (error) {

                // File doesn't exist, which is fine
                if (error.code !== 'ENOENT') {
                    throw error; // Other errors should be thrown
                }

            }
            /* c8 ignore stop */
        }

        const cacheDir = path.join(this.config.dir, segment, '+');
        
        if (await exists(cacheDir)) {
            await walkDir(cacheDir, cb);

            if (bestMatch) {
                return bestMatch;  
            }
        }
              
    }

    async set(obj) {
        let segment;
        let query;
        let response;
        let isSemantic;
        let ttl;

        if (!obj || !obj.query) {

            if (!query) {
                console.error("error: 'query' is required to GET its value");
                return false;
            }

        }
        else if (!obj || !obj.response) {

            if (!response) {
                console.error("error: 'response' is required to SET its value");
                return false;
            }

        }
        else {
            segment = obj.segment ?? this.config.segment;
            query = obj.query;
            response = obj.response;
            isSemantic = obj.isSemantic ?? false;
            ttl = obj.ttl ?? this.config.ttl;
        }

        const data = { 
            query, 
            response,
            stored: Date.now(),
            ttl
        }
        
        const { filepath, filename } = genPaths({
            dir: this.config.dir, 
            segment, 
            isSemantic,
            query
        });
        const cacheFile = path.join(filepath, filename);

        try {
            await mkdir(filepath, { recursive: true });
            await fs.writeFile(cacheFile, JSON.stringify(data));
            return data;
        }

        /* c8 ignore start */
        catch (error) {
            throw new Error(
                `Failed to write to "${cacheFile}": ${error.message}`
            );
        }
        /* c8 ignore stop */

    }

    async rm(obj) {
        let segment;
        let query;
        let isSemantic;

        if (!obj || !obj.query) {

            if (!query) {
                console.error("error: 'query' is required to REMOVE its value");
                return false;
            }

        }
        else {
            segment = obj.segment ?? this.config.segment;
            isSemantic = obj.isSemantic ?? false;
            query = obj.query;
        }

        const { filepath, filename } = genPaths({
            dir: this.config.dir, 
            segment, 
            isSemantic,
            query
        });
        const cacheFile = path.join(filepath, filename);

        if (await exists(cacheFile)) {
            await fs.unlink(cacheFile);
            return true;
        }

    }

    // aliases
    async del(obj) { 
        return await this.rm(obj) 
    }

    async delete(obj) { 
        return await this.rm(obj) 
    }

    async queries(obj) {
        const segment = (obj && obj.segment) ?? this.config.segment;
        let typeOfQueries = (obj && obj.typeOfQueries) ?? 'existing';
        let isSemantic = (obj && obj.isSemantic) ?? false;

        // Check if target directory exists
        const sem = isSemantic ? '+' : '-';
        const cacheDir = path.join(this.config.dir, segment, sem);

        if (await exists(cacheDir)) {
            return await this.#_queries(segment, isSemantic, typeOfQueries);
        }

    }

    async #_queries(segment, isSemantic, typeOfQueries) {
        const result = {
            existing: [],
            pruned: 0
        };

        const cb =  async (file) => {

            if (await exists(file)) {
                const data = await fs.readFile(file, 'utf8');
                const entry = JSON.parse(data);
                const query = entry.query;
                
                // Check TTL
                if (isExpired(entry)) {
                    await this.rm({ segment, query, isSemantic });
                    result.pruned++;
                }
                else {
                    result.existing.push(query);
                }
            }

            // /* c8 ignore start */
            // /* c8 ignore stop */
        }

        const sem = isSemantic ? '+' : '-';
        const cacheDir = path.join(this.config.dir, segment, sem);

        if (await exists(cacheDir)) {
            await walkDir(cacheDir, cb);
            return result[typeOfQueries];
        }
        
    }

    async prune(obj) {
        const segment = (obj && obj.segment) ?? this.config.segment;
        let typeOfQueries = (obj && obj.typeOfQueries) ?? 'pruned';
        let isSemantic = (obj && obj.isSemantic) ?? false;

        // Check if target directory exists
        const sem = isSemantic ? '+' : '-';
        const cacheDir = path.join(this.config.dir, segment, sem);

        if (await exists(cacheDir)) {
            return await this.#_queries(segment, isSemantic, typeOfQueries);
        }
        
    }

    async has(obj) {
        let segment;
        let query;
        let isSemantic;

        if (!obj || !obj.query) {

            if (!query) {
                console.error("error: 'query' is required to LOCATE its value");
                return false;
            }

        }
        else {
            segment = obj.segment ?? this.config.segment;
            isSemantic = obj.isSemantic ?? false;
            query = obj.query;
        }

        const { filepath, filename } = genPaths({
            dir: this.config.dir, 
            segment, 
            isSemantic,
            query
        });
        const cacheFile = path.join(filepath, filename);

        if (await exists(cacheFile)) {
            return true;
        }

        return false;

    }
    
}

export { Cache }