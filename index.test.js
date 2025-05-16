import t from 'tap';
import { Cache } from './index.js';

// Create a new semantic cache with a 5 sec time to live
const cache = new Cache({
    ttl: 5000
});

const tests = [
    async (t, cache) => {
        const d = await cache.queries();
        t.same(d, []);
    },

    async (t, cache) => {
        const query1 = 'What is the speed of a swallow?';
        const answer1 = 500;
        const isSemantic = true;
        const d = await cache.set(query1, answer1, isSemantic);
        t.equal(d.response, 500);
    },

    async (t, cache) => {
        const query2 = 'What is the speed of a turtle?';
        const answer2 = 250;
        const isSemantic = true;
        const d = await cache.set(query2, answer2, isSemantic);
        t.equal(d.response, 250);
    },

    async (t, cache) => {
        const query1 = 'What is the speed of a swallow?';
        const isSemantic = true;
        const d = await cache.get(query1, isSemantic);
        t.equal(d.response, 500);
    },

    async (t, cache) => {
        const query3 = 'How fast does the swallow fly?';
        const isSemantic = true;
        const d = await cache.get(query3, isSemantic);
        t.equal(d.response, 500);
    },

    async (t, cache) => {
        const query4 = 'How fast does the turtle move?';
        const isSemantic = true;
        const d = await cache.get(query4, isSemantic);
        t.equal(d.response, 250);
    },

    async (t, cache) => {
        const d = await cache.keys();
        t.same(d, [
            '067dd5f4e9df080730bc1013f02238dd',
            '543d191182d728ee25dcba4f583cea26'
        ]);
    },

    async (t, cache) => {
        const d = await cache.queries();
        t.same(d, [ 
            'What is the speed of a swallow?', 
            'What is the speed of a turtle?' 
        ]);
    },

    async (t, cache) => {
        const query1 = 'What is the speed of a swallow?';
        const d = await cache.has(query1);
        t.equal(d, true);
    },

    async (t, cache) => {
        const d = await cache.set('Capital of France', 'Paris');
        t.equal(d.response, 'Paris');
    },

    async (t, cache) => {
        const d = await cache.del('Capital of France');
        t.equal(d, true);
    },

    async (t, cache) => {
        const d = await cache.set('Water boils at', 100);
        t.equal(d.response, 100);
    },

    async (t, cache) => {
        const d = await cache.delete('Water boils at');
        t.equal(d, true);
    },

    async (t, cache) => {
        const d = await cache.prune();
        t.equal(d, 0);
    },

    async (t, cache) => {
        setTimeout(async function() {
            const d = await cache.queries();
            t.same(d, []);
        }, 5000)
    }
]

t.test('testing cache', async t => {
    t.plan(tests.length);

    for (let i = 0, j = tests.length; i < j; i++) {
        const test = tests[i];
        await test(t, cache);
    }
    
})