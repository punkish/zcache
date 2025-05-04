import fs from 'fs';
import path from 'path';

/*******************************/
/*   asynchronous functions    */
/*******************************/

const mkdirAsync = async (dir) => {
    try {

        // check if dir exists
        await fs.promises.access(dir, fs.constants.F_OK);

        // yes, it does
        // move on
    }
    catch (error) {

        // dir doesn't exist, so make it first
        try {
            await fs.promises.mkdir(dir, { recursive: true });
        }
        catch (error) {
            console.error(error);
        }
    }
}

/*
 * walk a directory and return all the entries as an array
 * see https://stackoverflow.com/a/16684530/183692
 */
const walkAsync = async (dir, results = []) => {

    // the `withFileTypes` option saves having to call stat() on every file
    const files = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            await walkAsync(fullPath, results);
        } 
        else if (path.extname(file.name) === '.json') {

            /* Is a file */
            const key = path.basename(file.name, '.json');
            results.push(key);
        }
    }

    return results;
}

const getAsync = (file) => {
    
    async function _getAsync(file) {
        try {
            const data = await fs.promises.readFile(file, 'utf8');
            const d = JSON.parse(data);
    
            if (d.stored + d.ttl > Date.now()) {
                return d;
            }
            
            return false;
        }
    
        // if there was an error reading the file
        catch (error) {
            //console.error(error);
            return false;
        }
    }

    function fn(file) {
        return _getAsync(file)
            .then(result => {
                return result;
            })
            // .catch(error => {
            //     return false;
            // });
    }

    fn(file).then(bool => bool);
}

const setAsync = async (file, data) => {
    const dirname = path.dirname(file);
    await mkdirAsync(dirname); 
    await fs.promises.writeFile(file, JSON.stringify(data));
    return data;
}

const hasAsync = async (file) => {
    try {

        // check if file exists
        await fs.promises.access(file, fs.constants.F_OK);

        // yes, it does
        // move on
        return true;
    }
    catch (error) {

        // file doesn't exist
        return false;
    }
}

const rmAsync = async (file) => {
    try {

        // check if file exists
        await fs.promises.access(file, fs.constants.F_OK);

        // yes, it does, remove it
        await fs.promises.rm(file);
        return true;
    }
    catch (error) {

        // file doesn't exist
        return false;
    }
}

const clearAsync = async (dir) => {
    try {

        // check if file exists
        await fs.promises.access(dir, fs.constants.F_OK);

        // yes, it does, remove it
        await fs.promises.rm(dir, { recursive: true });
        return true;
    }
    catch (error) {

        // file doesn't exist
        return false;
    }
}

const allAsync = async (dir) => {
    const all = [];
    const keys = await walkAsync(dir);

    for (let key of keys) {
        const val = await getAsync(dir, key);
        all.push([key, val])
    }

    return all;
}

export {
    mkdirAsync,
    walkAsync,
    getAsync,
    setAsync,
    hasAsync,
    rmAsync,
    clearAsync,
    allAsync
}