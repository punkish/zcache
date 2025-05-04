import fs from 'fs';
import path from 'path';

/*******************************/
/*    synchronous functions    */
/*******************************/

const mkdir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return true;
}

/*
 * walk a directory and return the basenames of all the json files as an array
 * see https://stackoverflow.com/a/16684530/183692
 */
const keys = function(dir, results = []) {

    // the `withFileTypes` option saves having to call stat() on every file
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (let file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            keys(fullPath, results);
        } 
        else if (path.extname(file.name) === '.json') {

            /* Is a file */
            const key = path.basename(file.name, '.json');
            results.push(key);
        }
    }

    return results;
}

const get = (file) => {
    if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file));
    }
    
    return false;
}

const set = (file, data) => {
    const dirname = path.dirname(file);
    mkdir(dirname);    
    fs.writeFileSync(file, JSON.stringify(data));
    return data;
}

const has = (file) => {
    if (fs.existsSync(file)) {
        return true;
    }

    return false;
}

const rm = (file) => {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        return true;
    }
    
    return false;
}

const clear = (dir) => {
    if (fs.existsSync(dir)) {
        fs.unlinkSync(dir);
        return true;
    }
    
    return false;
}

export {
    mkdir,
    get,
    set,
    has,
    rm,
    clear,
    keys
}