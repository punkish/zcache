import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'path';
import { generateEmbedding, calculateSimilarity } from './lib/similarity.js';

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
        this.config.dirNameSpace = this.#genDirNameSpace()
    }

    async init() {

        // Ensure cache directory exists
        const dirNameSpace = this.#genDirNameSpace();
        this.#mkdir(dirNameSpace);
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
        const { dirNameSpace123File } = this.#genPaths(query);

        try {
            const data = await fs.readFile(dirNameSpace123File, 'utf8');
            const entry = JSON.parse(data);
            
            // Check TTL
            if (this.#isExpired(entry)) {
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
        const srcEmbedding = await this.#generateEmbedding(query);
        let bestMatch;
        let highestSimilarity = 0;
        const isExpired = this.#isExpired;
        const generateEmbedding = this.#generateEmbedding;
        const similarityThreshold = this.config.similarityThreshold
        const calculateSimilarity = this.#calculateSimilarity;
        const rm = this.rm;
        const that = this;

        function cb({ file }) {
            
            return async function() {
                try {
                    const data = await fs.readFile(file, 'utf8');
                    const entry = JSON.parse(data);
                    const query = entry.query;
                    
                    // Check TTL
                    if (isExpired(entry)) {
                        await rm.call(that, query);
                        return false;
                    }

                    if (entry.isSemantic) {
                        const tgtEmbedding = await generateEmbedding(query);

                        // Only similarity > similarityThreshold will be 
                        // returned
                        const similarity = calculateSimilarity(
                            srcEmbedding, 
                            tgtEmbedding,
                            similarityThreshold
                        );

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

        }

        await this.#walkDir(cb);

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
        
        const { dirNameSpace123, dirNameSpace123File } = this.#genPaths(query);
        await this.#mkdir(dirNameSpace123);

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

    async prune() {
        let pruned = 0;
        const isExpired = this.#isExpired;
        const rm = this.rm;
        const that = this;

        function cb({ file }) {
            
            return async function() {
                try {
                    const data = await fs.readFile(file, 'utf8');
                    const entry = JSON.parse(data);
                    const query = entry.query;
                    
                    // Check TTL
                    if (isExpired(entry)) {
                        await rm.call(that, query);
                        pruned++;
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
        }

        await this.#walkDir(cb);
        return pruned
    }

    async rm(query) {
        if (!query) {
            console.error("error: 'query' is required to delete it");
            return false;
        }

        const { dirNameSpace123File } = this.#genPaths(query);
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

    // TODO
    //getStats() {

        // Count expired entries
        //let expiredCount = 0;

        // for (const entry of this.cache.values()) {
        //     if (this.#isExpired(entry)) {
        //         expiredCount++;
        //     }
        // }
     
        // return {
        //     size: this.cache.size,
        //     maxSize: this.maxSize,
        //     expired: expiredCount
        // };
    //}

    // aliases
    async del(query) { return await this.rm(query) }
    async delete(query) { return await this.rm(query) }

    async queries() {
        const queries = [];
        const isExpired = this.#isExpired;
        const rm = this.rm;
        const that = this;

        function cb({ file }) {
            return async function() {
                try {

                    const data = await fs.readFile(file, 'utf8');
                    const entry = JSON.parse(data);
                    const query = entry.query;
                    
                    // Check TTL
                    if (isExpired(entry)) {
                        await rm.call(that, query);
                        return false;
                    }
        
                    queries.push(query);
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
        }

        await this.#walkDir(cb)
        return queries.length ? queries : 0
    }

    async keys() {
        const results = [];

        function cb({ key }) {
            return function() {
                results.push(key);
            }
        }

        await this.#walkDir(cb)
        return results
    }

    async has(query) {
        if (!query) {
            console.error("error: 'query' is required to locate it");
            return false;
        }

        const { dirNameSpace123File } = this.#genPaths(query);
        
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

    async #mkdir(dir) {
        try {
            await fs.mkdir(dir, { recursive: true });
        }

        /* c8 ignore start */
        catch (error) {
            throw new Error(`Failed to create "${dir}": ${error.message}`);
        }
        /* c8 ignore stop */
    }

    #isExpired(entry) {
        return ((entry.stored + entry.ttl) - Date.now()) <= 0
    }

    /**
     * calculate dirNameSpace
     * @returns {string} - full path to cache namespace
     * given   dir          = './'
     *         name         = 'cache'
     *         space        = 'default'
     * returns dirNameSpace = './cache/default'
     */
    #genDirNameSpace() {
        return path.join(this.config.dir, this.config.name, this.config.space)
    }

    #genDirNameSpace123File(key, dirNameSpace) {

        // full filename of the result
        // returns 'acbd18db4cc2f85cedef654fccc4a4d8.json'
        const file = `${key}.json`;

        // calculate filePath
        // returns './cache/default/a/ac/acb'
        const [ _, thr, two, one ] = key.match(/(((\w)\w)\w)/);
        const dirNameSpace123 = path.join(dirNameSpace, one, two, thr);

        // full path to the filename
        // returns './cache/default/a/ac/acb/acbd18db4cc2f85cedef654fccc4a4d8.json'
        const dirNameSpace123File = path.join(dirNameSpace123, file);
        return { file, dirNameSpace123, dirNameSpace123File }
    }

    #genPaths(query) {
        const dirNameSpace = this.#genDirNameSpace();
    
        // convert query to key
        // given   'What is the speed of an unladen swallow?'
        // returns 'acbd18db4cc2f85cedef654fccc4a4d8'
        const key = crypto.createHash('md5').update(query).digest('hex');
        const { file, dirNameSpace123, dirNameSpace123File } = this.#genDirNameSpace123File(key, dirNameSpace);
    
        return { 
            dirNameSpace, 
            key, 
            file, 
            dirNameSpace123, 
            dirNameSpace123File 
        }
    }

    async #walkDir(cb, dir = this.config.dirNameSpace) {

        /*
         * walk a directory and return the basenames of all the json files as 
         * an array. See https://stackoverflow.com/a/16684530/183692
         */

        // the `withFileTypes` option saves having to call stat() on every file
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            
            if (entry.isDirectory()) {
                const newdir = path.join(dir, entry.name);
                await this.#walkDir(cb, newdir);
            }

            // Is a file
            else {

                if (path.extname(entry.name) === '.json') {
                    const file = path.join(dir, entry.name);
                    const params = { 

                        // clear() needs this
                        // get() needs this
                        // prune() needs this
                        file
                    }

                    // keys() 
                    const key = path.basename(entry.name, '.json');
                    params.key = key; 

                    const fn = cb(params);
                    await fn();
                }
                
            }

        }

    }

    /**
     * Generate embedding for a query
     */
    async #generateEmbedding(query) {
        return generateEmbedding(query)
    }

    #calculateSimilarity(embedding1, embedding2, similarityThreshold) {
        const similarity = calculateSimilarity(embedding1, embedding2);

        if (similarity >= similarityThreshold) {
            return similarity;
        }

        return false;
    }
    
}

export { Cache }