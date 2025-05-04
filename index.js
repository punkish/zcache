import { sync } from './lib/utils.js';
import { cacheKeyFile } from './lib/utils.js';

/*
 * Create a cache (default options are shown below)
 *
 * const cache = new Cache(
 *      { 
 *          // The directory where the cache is stored.
 *          //
 *          // Default is a dir called 'cache'
 *          dir: './cache'
 * 
 *          // Duration ttl in ms for each entry. 
 *          //
 *          // Default is 1 day
 *          duration: 1 * 24 * 60 * 60 * 1000, 
 * 
 *          // A namespace to isolate the cache.
 *          // Namespaces can be cleared without clearing the 
 *          // entire cache. For example, if there are multiple 
 *          // namespaces -- 'default', 'employees', 'partner' -- 
 *          // cache.clear('employees') will clear only that 
 *          // namespace and leave the others alone.
 *          //
 *          // Default is 'default'.
 *          namespace: 'default', 
 * 
 *          // cache methods synchronous or asynchronous. An 
 *          // async cache uses async/await
 *          //
 *          // Default is sync = true
 *          sync: true 
 *      });
 * 
 * The following methods are available
 * 
 * =================================================================
 * method   | description                                           
 * -----------------------------------------------------------------
 * get      | get(key) retrieves key from cache                     
 * set      | set(key, val) sets key to val in cache                
 * has      | has(key) returns true if key exists in cache          
 * rm       | rm(key) removes key from cache
 * delete   | delete(key) -- synonym for rm    
 * clear    | clear(namespace) deletes the entire cache namespace           
 * keys     | keys() lists all the keys in the cache                
 * all      | all() lists all the keys and their values in the cache
 * opts     | opts() lists all the cache options                    
 * ================================================================= 
 * 
 */

class Cache {

    constructor(opts) {
        const defaultOpts = {

            // Default cache storage
            dir: './cache',

            // Default namespace inside cache
            namespace: 'default',

            // Default ttl one day in milliseconds
            duration: 1 * 24 * 60 * 60 * 1000,

            // Defaul use synchronous vs asynchronous methods
            sync: true
        }

        Object.assign(this, defaultOpts,  opts);
        this.nsdir = `${this.dir}/${this.namespace}`;
        sync.mkdir(this.nsdir);
        //this.sync ? sync.mkdir(this.nsdir) : mkdirAsync(this.nsdir);
    }

    get = (key) => {
        if (!key) {
            console.error("error: 'key' is required to get its value");
            return false;
        }

        const file = cacheKeyFile(this.nsdir, key);
        const data = sync.get(file);

        return (data.stored + data.ttl) > Date.now()
            ? data
            : false;
    }

    set = (key, val, duration) => {
        if (!key) {
            console.error("error: 'key' is required to set its value");
            return false;
        } 

        const file = cacheKeyFile(this.nsdir, key);

        const data = {
            item: val,
            stored: Date.now(),
            ttl: duration
                ? duration
                : this.duration
        };

        return sync.set(file, data);

        // return this.sync 
        //     ? setSync(file, data)
        //     : setAsync(file, data);
    }

    has = (key) => {
        if (!key) {
            console.error("error: 'key' is required for has(key) to work");
            return false;
        } 

        const file = cacheKeyFile(this.nsdir, key);
        return sync.has(file);

        // return this.sync 
        //     ? hasSync(file) 
        //     : hasAsync(file);
    }

    rm = (key) => {
        if (!key) {
            console.error("error: 'key' is required to remove it from cache");
            return false;
        }

        const file = cacheKeyFile(this.nsdir, key);
        return sync.rm(file);
        // return this.sync 
        //     ? rmSync(file) 
        //     : rmAsync(file);
    }

    delete = (key) => this.rm(key);

    clear = (namespace) => {
        if (!namespace) {
            console.error("error: 'namespace' is required to clear cache");
            return false;
        }

        return sync.clear(this.nsdir);

        // return this.sync 
        //     ? clearSync(this.nsdir) 
        //     : clearAsync(this.nsdir);
    }
  
    keys = () => {
        return sync.keys(this.nsdir);
        // this.sync 
        // ? walkSync(this.nsdir) 
        // : walkAsync(this.nsdir);
    }

    // all = () => this.sync 
    //     ? allSync(this.nsdir) 
    //     : allAsync(this.nsdir);

    opts = () => {
        return {
            dir: this.dir,
            namespace: this.namespace,
            duration: this.duration,
            sync: this.sync
        };
    }
}

export { Cache };