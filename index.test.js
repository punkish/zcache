import t from 'tap';
import { Cache } from './index.js';

t.test('testing cache', async (t) => {
    t.plan(25);

    // Create a new semantic cache with a 1 sec time to live
    const cache = new Cache({
        ttl: 1000
    });

    await cache.init();

    let d = await cache.queries();
    t.same(d.length, 0, "1. QUERIES no queries in cache");

    d = await cache.get("");
    t.equal(d, false, "2. GET no query provided");

    d = await cache.set("");
    t.equal(d, false, "3. SET no query provided");

    d = await cache.set("Query with no response");
    t.equal(d, false, "4. SET no response provided");

    d = await cache.get("non-existing query");
    t.throws(d, false, "5. GET non-existing query");

    let query = 'What is the speed of a turtle?';
    let response = 250;
    d = await cache.set(query, response, true);
    t.equal(d.response, response, "6. SET semantic query");

    d = await cache.get('How fast does the turtle move?', true);
    t.equal(d.response, response, "7. GET semantic query");

    t.equal(await cache.has(""), false, "8. HAS query required to located it");

    query = 'What is the speed of a swallow?';
    response = 500;
    d = await cache.set(query, response, true);
    t.equal(d.response, response, "9. SET semantic query");

    d = await cache.get(query, true);
    t.equal(d.response, response, "10. GET semantic query");

    t.equal(await cache.has(query), true, "11. HAS query");

    d = await cache.get('How fast does the swallow fly?', true);
    t.equal(d.response, response, "12. GET semantic query");

    setTimeout(async function() {
        const d = await cache.get('What is the speed of a swallow?', true);
        t.equal(d, false, "13. GET wait 1s so the expired query is removed");
    }, 1100);

    query = 'Capital of France';
    response = 'Paris';
    d = await cache.set(query, response);
    t.equal(d.response, response, "14. SET non-semantic query");

    d = await cache.queries();
    t.same(
        d, 
        [ 
            "What is the speed of a swallow?",
            "What is the speed of a turtle?",
            "Capital of France"
         ], 
        "15. QUERIES list queries in cache"
    );

    d = await cache.del(query);
    t.equal(d, true, "16. DEL non-semantic query");

    query = 'Water boils at';
    response = 100;
    d = await cache.set(query, response);
    t.equal(d.response, response, "17. SET non-semantic query");

    d = await cache.delete('');
    t.equal(d, false, "18. DELETE no query provided");

    d = await cache.delete(query);
    t.equal(d, true, "19. DELETE non-semantic query");

    d = await cache.set(query, response);
    t.equal(d.response, response, "20. SET non-semantic query");

    setTimeout(async function() {
        const d = await cache.get(query);
        t.equal(d, false, "21. GET wait 1s, then remove expired query");
    }, 1100);

    d = await cache.prune();
    t.equal(d, 0, "22. PRUNE remove expired queries");

    setTimeout(async function() {
        const d = await cache.queries();
        t.same(d, [], "23. QUERIES wait 5 seconds, then list queries in cache");
    }, 5000);

    d = await cache.set(query, response);
    t.equal(d.response, 100, "24. SET non-semantic query");

    setTimeout(async function() {
        const d = await cache.prune();
        t.equal(d, 1, "25. PRUNE wait 1s, then remove expired queries");
    }, 1100);
    
})