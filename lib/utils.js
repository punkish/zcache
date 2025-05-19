import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'path';

function isExpired(entry) {
    return ((entry.stored + entry.ttl) - Date.now()) <= 0
}

/**
 * walk a directory and return the basenames of all the json files as 
 * an array. See https://stackoverflow.com/a/16684530/183692
 */
async function walkDir(dir, cb) {

    // the `withFileTypes` option saves having to call stat() on every file
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        if (entry.isDirectory()) {
            const newdir = path.join(dir, entry.name);
            await walkDir(newdir, cb);
        }

        // Is a file
        else {

            if (path.extname(entry.name) === '.json') {
                const file = path.join(dir, entry.name);
                await cb(file)
            }
            
        }

    }

}

async function mkdir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    }

    /* c8 ignore start */
    catch (error) {
        throw new Error(`Failed to create "${dir}": ${error.message}`);
    }
    /* c8 ignore stop */
}

function genPaths(query, dirNameSpace) {
    
    // convert query to cacheKey
    // given   'What is the speed of an unladen swallow?'
    // returns 'acbd18db4cc2f85cedef654fccc4a4d8'
    const cacheKey = crypto.createHash('md5').update(query).digest('hex');

    // calculate filePath
    // returns './cache/default/a/ac/acb'
    const [ _, thr, two, one ] = cacheKey.match(/(((\w)\w)\w)/);
    const dirNameSpace123 = path.join(dirNameSpace, one, two, thr);

    // full path to the filename. For eg.
    // './cache/default/a/ac/acb/acbd18db4cc2f85cedef654fccc4a4d8.json'
    const dirNameSpace123File = path.join(
        dirNameSpace123, 
        `${cacheKey}.json`
    );

    return { dirNameSpace123, dirNameSpace123File }
}

export { isExpired, walkDir, mkdir, genPaths }