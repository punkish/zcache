import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'path';

function isExpired(entry) {

    if (entry.ttl < 0) {

        // lives forever
        return false;
    }
    else {
        return ((entry.stored + entry.ttl) - Date.now()) <= 0
    }

}

// https://sabe.io/blog/node-check-file-exists-async-await
async function exists(path) {
    return !!(await fs.stat(path).catch(e => false));
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


//                             ┌─────────┐                       
// ┌──────────────────────────▶│filepath  │◀─────────────────────┐ 
// │                           └─────────┘                      │ 
// │                                                            │ 
// │                                                            │ 
// ┌───────┐ ┌──────────┐ ┌───┐ ┌────────┐ ┌──────────────┬─────┐
// │./cache│ │treatments│ │+|-│ │a/ac/acb│ │acb024fab424cf│.json│
// └───────┘ └──────────┘ └───┘ └────────┘ └──────────────┴─────┘
//     │           │        │        │             │         │   
//     │           │        │        │             │         │   
//     ▼           ▼        ▼        ▼             ▼         ▼   
// ┌───────┐ ┌──────────┐ ┌───┐ ┌────────┐ ┌──────────────┬─────┐
// │  dir  │ │ segment  │ │sem│ │ o/t/r  │ │     key      │ ext │
// └───────┘ └──────────┘ └───┘ └────────┘ └──────────────┴─────┘
//                                                      │        
//                                                      │        
//                                                      ▼        
//                                               ┌──────────────┐
//                                               │   filename    │
//                                               └──────────────┘

function genPaths({ dir, segment, isSemantic = false, query }) {
    
    // convert query to cacheKey
    // given   'What is the speed of an unladen swallow?'
    // returns 'acbd18db4cc2f85cedef654fccc4a4d8'
    const cacheKey = crypto
        .createHash('md5')
        .update(query.toLowerCase())
        .digest('hex');

    // calculate the three-level sub-directories
    // given 'acbd18db4cc2f85cedef654fccc4a4d8'
    // returns 'a', 'ac', 'acb'
    const [ _, thr, two, one ] = cacheKey.match(/(((\w)\w)\w)/);

    const sem = isSemantic ? '+' : '-';

    // returns './cache/treatments/(+|-)/a/ac/acb'
    return { 
        filepath: path.join(dir, segment, sem, one, two, thr), 
        filename: `${cacheKey}.json` 
    }
}

export { isExpired, walkDir, mkdir, genPaths, exists }