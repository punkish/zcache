import tap from 'tap';
import * as utils from './utils.js';

const testGroupsSync = {
    key2path: [
        {
            input: {
                key: 'E83A2C2AFF8DFFA5FF76FC9F5ADD6BFE'
            },
            wanted: 'E/E8/E83'
        }
    ],
    genCacheKey: [
        {
            input: {
                str: 'foo'
            },
            wanted: 'acbd18db4cc2f85cedef654fccc4a4d8'
        },
        {
            input: {
                str: 'biome=Tropical%20and%20Subtropical%20Coniferous%20Forests&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption'
            },
            wanted: '4056fa61ccef5ea9c96a299ca5ebc54e'
        }
    ],
    mkdirSync: [
        {
            input: {
                dir: './cache/default/a/ac/acb'
            },
            wanted: true
        }
    ],
    allSync: [
        {
            input: {
                dir: './cache/default'
            },
            wanted: [ "acbd18db4cc2f85cedef654fccc4a4d8" ]
        }
    ],
    getSync: [
        {
            input: {
                file: './cache/a/ac/acb/acbd18db4cc2f85cedef654fccc4a4d8.json'
            },
            wanted: false
        },
        {
            input: {
                file: './cache/default/a/ac/acb/acbd18db4cc2f85cedef654fccc4a4d8.json'
            },
            wanted: {
                a: 'foo',
                b: 'bar',
                c: 'baz'
            }
        }
    ],
    setSync: [
        {
            input: {
                file: './cache/default/a/ac/acb/acbd18db4cc2f85cedef654fccc4a4d8.json',
                data: {
                    a: 'foo',
                    b: 'bar',
                    c: 'baz'
                }
            },
            wanted: {
                a: 'foo',
                b: 'bar',
                c: 'baz'
            }
        }
    ],
    hasSync: [
        {
            input: {
                file: './cache/default/a/ac/acb/acbd18db4cc2f85cedef654fccc4a4d8.json'
            },
            wanted: true
        },
        {
            input: {
                file: './cache/a/ac/acb/acbd18db4cc2f85cedef654fccc4a4d8.json'
            },
            wanted: false
        }
    ]
}

Object.keys(testGroupsSync).forEach((testGroupName) => {

    const tests = testGroupsSync[testGroupName];
    
    tap.test(`${testGroupName}`, tap => {
        tests.forEach((test, i) => {
            const input = Object.values(test.input);
            const found = utils[testGroupName](...input);
            tap.same(found, test.wanted, `${testGroupName} ${i}`);  
        });

        tap.end();
    });

});