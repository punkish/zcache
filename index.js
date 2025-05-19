import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'path';
import { generateEmbedding, calculateSimilarity } from './lib/similarity.js';
import { isExpired, walkDir, mkdir, genPaths } from './lib/utils.js';
/**
* Create a cache 
* @param {Object} opts - Configuration options for the cache
* @param {integer} opts.maxSize - Max entries in the cache (100)
* @param {number} opts.similarityThreshold - Semantic similarity threshold (0.9)
* @param {integer} opts.ttl - Time to live in ms (default 1 day)
* @param {string} opts.zDir - Basedir for the cache ('./cache')
* @param {string} opts.zSpace - Cache namespace ('default')
* @returns {Object} - Cache API object
* const cache = new Cache(
*      { 
*          dir: './'
*          name: 'cache',
*          space: 'default',
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
* prune    | prune() removes expired keys
* keys     | keys() lists all the keys in the cache
* has      | has(query) return true or false
* ================================================================= 
*/
class Cache {
    constructor(opts = {}) {

        // Configuration option defaults
        const config = {
            dir: './',
            name: 'cache',
            space: 'default',

            //   d      h     m       s     ms
            //   ▲      ▲     ▲       ▲      ▲
            //   │      │     │       │      │
            ttl: 1  *  24  *  60  *  60 *  1000,
            similarityThreshold: 0.9
        };

        this.config = {}
        Object.assign(this.config, config,  opts);
        this.config.dirNameSpace = path.join(
            this.config.dir, this.config.name, this.config.space
        )
    }

    // Ensure cache directory exists
    async init() {
        await mkdir(this.config.dirNameSpace)
    }

    async get(query, isSemantic = false) {
        if (!query) {
            console.error("error: 'query' is required to get its value");
            return false;
        }

        // First, check if there is an exact query
        let cachedData = await this.#get(query);
        if (cachedData) return cachedData;
        
        if (isSemantic) {

            // No exact query found, so check for semantically similary queries
            cachedData = await this.#getSem(query);
            if (cachedData) return cachedData;
        }
        
        // Nothing found
        return false;
    }

    async #get(query) {
        const { 
            dirNameSpace123File 
        } = genPaths(query, this.config.dirNameSpace);

        try {
            const data = await fs.readFile(dirNameSpace123File, 'utf8');
            const entry = JSON.parse(data);
            
            // Check TTL
            if (isExpired(entry)) {
                await this.rm(query);
                return false;
            }

            return entry;
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

    async #getSem(query) {

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
                    await this.rm(query);
                    return false;
                }

                if (entry.isSemantic) {
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

        await walkDir(this.config.dirNameSpace, cb);

        if (bestMatch) {
            return bestMatch;  
        }
              
    }

    async set(query, response, isSemantic = false, ttl = this.config.ttl) {
        if (!query) {
            console.error("error: 'query' is required to set its value");
            return false;
        }

        if (!response) {
            console.error("error: 'response' is required to store the query");
            return false;
        }

        const data = { 
            query, 
            response,
            stored: Date.now(),
            ttl
        }

        if (isSemantic) {
            data.isSemantic = true;
        }
        
        const { 
            dirNameSpace123, 
            dirNameSpace123File 
        } = genPaths(query, this.config.dirNameSpace);
        await mkdir(dirNameSpace123);

        try {
            await fs.writeFile(dirNameSpace123File, JSON.stringify(data));
            return data;
        }

        /* c8 ignore start */
        catch (error) {
            throw new Error(
                `Failed to write to "${dirNameSpace123File}": ${error.message}`
            );
        }
        /* c8 ignore stop */

    }

    async rm(query) {
        if (!query) {
            console.error("error: 'query' is required to delete it");
            return false;
        }

        const { 
            dirNameSpace123File 
        } = genPaths(query, this.config.dirNameSpace);
        try {
            await fs.unlink(dirNameSpace123File);
            return true;
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

    // aliases
    async del(query) { return await this.rm(query) }
    async delete(query) { return await this.rm(query) }

    async #_queries(type) {
        const result = {
            queries: [],
            pruned: 0
        };

        const cb =  async (file) => {
            try {
                const data = await fs.readFile(file, 'utf8');
                const entry = JSON.parse(data);
                const query = entry.query;
                
                // Check TTL
                if (isExpired(entry)) {
                    await this.rm(query);
                    result.pruned++;
                }
                else {
                    result.queries.push(query);
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

        await walkDir(this.config.dirNameSpace, cb)
        return result[type]
    }

    async queries() {
        return await this.#_queries('queries')
    }

    async prune() {
        return await this.#_queries('pruned')
    }

    async has(query) {
        if (!query) {
            console.error("error: 'query' is required to locate it");
            return false;
        }

        const { 
            dirNameSpace123File 
        } = genPaths(query, this.config.dirNameSpace);
        
        try {

            // Check if the target file exists
            await fs.access(dirNameSpace123File);
            return true;
        }

        /* c8 ignore start */
        catch (error) {
            
            if (error.code === 'ENOENT') {
                return false;
            }
            else {
                throw error.message; // Other errors should be thrown
            }

        }
        /* c8 ignore stop */

    }
    
}

export { Cache }