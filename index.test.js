import t from 'tap';
import { Cache } from './index.js';

// Create a new semantic cache with a 5 sec time to live
const cache = new Cache({
    ttl: 5000
});

t.test('testing cache', async t => {
    const query1 = 'What is the speed of a swallow?';
    const answer1 = 500;
    const isSemantic = true;
    let d = await cache.set(query1, answer1, isSemantic);
    t.equal(d.response, 500);

    const query2 = 'What is the speed of a turtle?';
    const answer2 = 250;
    d = await cache.set(query2, answer2, isSemantic);
    t.equal(d.response, 250);

    d = await cache.get(query1, isSemantic);
    t.equal(d.response, 500);

    const query3 = 'How fast does the swallow fly?';
    d = await cache.get(query3, isSemantic);
    t.equal(d.response, 500);

    const query4 = 'How fast does the turtle move?';
    d = await cache.get(query4, isSemantic);
    t.equal(d.response, 250);

    d = await cache.keys();
    t.same(d, [
        '067dd5f4e9df080730bc1013f02238dd',
        '543d191182d728ee25dcba4f583cea26'
    ]);

    d = await cache.queries();
    t.same(d, [ 
        'What is the speed of a swallow?', 
        'What is the speed of a turtle?' 
    ]);

    d = await cache.has(query1);
    t.equal(d, true);

    d = await cache.set('Capital of France', 'Paris');
    t.equal(d.response, 'Paris');

    d = await cache.del('Capital of France');
    t.equal(d, true);

    d = await cache.set('Water boils at', 100);
    t.equal(d.response, 100);

    d = await cache.delete('Water boils at');
    t.equal(d, true);

    d = await cache.prune();
    t.equal(d, 0);

    async function queries() {
        const d = await cache.queries();
        t.same(d, []);
    }

    setTimeout(queries, 4000)

    t.end();
})