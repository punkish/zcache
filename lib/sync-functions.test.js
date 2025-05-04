import tap from 'tap';
import * as utils from './utils.js';

const testGroups = {
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

Object.keys(testGroups).forEach((testGroupName) => {

    const tests = testGroups[testGroupName];
    
    tap.test(`${testGroupName}`, tap => {
        tests.forEach((test, i) => {
            const input = Object.values(test.input);
            const found = utils[testGroupName](...input);
            tap.same(found, test.wanted, `${testGroupName} ${i}`);
        });

        tap.end();
    });

});