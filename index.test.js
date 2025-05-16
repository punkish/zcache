import t from 'tap';
import { Cache } from './index.js';

t.test('testing cache', async (t) => {
    t.plan(26);

    // Create a new semantic cache with a 1 sec time to live
    const cache = new Cache({
        ttl: 1000
    });

    await cache.init();

    let d = await cache.queries();
    t.same(d, 0, "QUERIES no queries in cache");

    d = await cache.get("");
    t.equal(d, false, "GET no query provided");

    d = await cache.set("");
    t.equal(d, false, "SET no query provided");

    d = await cache.set("Query with no response");
    t.equal(d, false, "SET no response provided");

    d = await cache.get("non existing key");
    t.throws(d, false, "GET non existing key");

    let query = 'What is the speed of a turtle?';
    let response = 250;
    d = await cache.set(query, response, true);
    t.equal(d.response, response, "SET semantic query");

    d = await cache.get('How fast does the turtle move?', true);
    t.equal(d.response, response, "GET semantic query");

    t.same(
        await cache.keys(), 
        [ '543d191182d728ee25dcba4f583cea26' ],
        "KEY list of keys"
    );

    t.equal(await cache.has(""), false, "HAS query required to located it");

    query = 'What is the speed of a swallow?';
    response = 500;
    d = await cache.set(query, response, true);
    t.equal(d.response, response, "SET semantic query");

    d = await cache.get(query, true);
    t.equal(d.response, response, "GET semantic query");

    t.equal(await cache.has(query), true, "HAS query");

    d = await cache.get('How fast does the swallow fly?', true);
    t.equal(d.response, response, "GET semantic query");

    setTimeout(async function() {
        const d = await cache.get('What is the speed of a swallow?', true);
        t.equal(d, false, "GET wait 1s, then remove expired query");
    }, 1100);

    query = 'Capital of France';
    response = 'Paris';
    d = await cache.set(query, response);
    t.equal(d.response, response, "SET non-semantic query");

    t.same(
        await cache.queries(), 
        [ 
            "What is the speed of a swallow?",
            "What is the speed of a turtle?",
            "Capital of France"
         ], 
        "QUERIES list queries in cache"
    );

    d = await cache.del(query);
    t.equal(d, true, "DEL non-semantic query");

    query = 'Water boils at';
    response = 100;
    d = await cache.set(query, response);
    t.equal(d.response, response, "SET non-semantic query");

    d = await cache.delete('');
    t.equal(d, false, "DELETE no query provided");

    d = await cache.delete(query);
    t.equal(d, true, "DELETE non-semantic query");

    d = await cache.set(query, response);
    t.equal(d.response, response, "SET non-semantic query");

    setTimeout(async function() {
        const d = await cache.get(query);
        t.equal(d, false, "GET wait 1s, then remove expired query");
    }, 1100);

    t.equal(await cache.prune(), 0, "PRUNE remove expired queries");

    setTimeout(async function() {
        const d = await cache.queries();
        t.same(d, 0, "QUERIES wait 5 seconds, then list queries in cache");
    }, 5000);

    await cache.set(query, response);
    t.equal(d.response, 100, "SET non-semantic query");

    setTimeout(async function() {
        const d = await cache.prune();
        t.equal(d, 1, "PRUNE wait 1s, then remove expired queries");
    }, 1100);
    
})