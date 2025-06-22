import t from 'tap';
import { Cache } from './index.js';
import * as fs from 'fs';

// fs.rmSync('./cache', { recursive: true, force: true });

t.skip('testing non-existent queries', async (t) => {

    // Create a semantic cache with a 1 sec time to live
    const cache = new Cache({
        ttl: 1000
    });

    await cache.init();

    let d;

    d = await cache.queries({});
    t.same(d.length, 0, "QUERIES one query in cache");

    d = await cache.get();
    t.equal(d, false, "GET no query provided");

    d = await cache.set();
    t.equal(d, false, "SET no query provided");

    d = await cache.set({ query: "Query with no response" });
    t.equal(d, false, "SET no response provided");

    d = await cache.get({ query: "non-existing query" });
    t.throws(d, false, "GET non-existing query");

    d = await cache.rm();
    t.throws(d, false, "RM non-existing query");

    d = await cache.del();
    t.throws(d, false, "DEL non-existing query");

    d = await cache.delete();
    t.throws(d, false, "DELETE non-existing query");

    t.end();
});

t.skip('testing non-semantic cache', async (t) => {

    // Create a new semantic cache with a 1 sec time to live
    const cache = new Cache({
        ttl: 1000
    });

    await cache.init();
    
    let d = await cache.set({ 
        segment: 'foo', 
        query: 'What is the speed of a turtle?', 
        response: 250
    });
    t.equal(d.response, 250, "SET non-semantic query");

    d = await cache.get({ 
        segment: 'foo', 
        query: 'What is the speed of a turtle?' 
    });
    t.equal(d.response, 250, "GET non-semantic query");

    t.equal(await cache.has(), false, "HAS query required to located it");
    t.equal(await cache.has({}), false, "HAS query required to located it");
    t.equal(
        await cache.has({ 
            segment: 'foo', 
            query: 'What is the speed of a turtle?' 
        }), 
        true, 
        "HAS non-semantic query"
    );
    t.same(
        await cache.queries({ segment: 'foo' }), 
        [ 'What is the speed of a turtle?' ], 
        "QUERIES non-semantic"
    );

    t.end();
});

t.skip('testing semantic cache', async (t) => {

    // Create a new semantic cache with a 1 sec time to live
    const cache = new Cache({
        ttl: 1000
    });

    await cache.init();

    let d = await cache.set({ 
        query: 'What is the speed of a turtle?', 
        response: 250, 
        isSemantic: true
    });
    t.equal(d.response, 250, "SET semantic query");

    d = await cache.get({ 
        query: 'What is the speed of a turtle?', 
        isSemantic: true 
    });
    t.equal(d.response, 250, "GET semantic query");

    d = await cache.get({ 
        query: 'How fast does a turtle move?', 
        isSemantic: true 
    });
    t.equal(d.response, 250, "GET semantic query");

    d = await cache.has({ 
        query: 'What is the speed of a turtle?' 
    });
    t.equal(d, false, "HAS non-semantic query");

    d = await cache.set({ 
        query: 'What is the speed of a swallow?', 
        response: 500, 
        isSemantic: true 
    });
    t.equal(d.response, 500, "SET semantic query");

    d = await cache.get({ 
        query: 'How fast does the swallow fly?', 
        isSemantic: true 
    });
    t.equal(d.response, 500, "GET semantic query");
})

// t.test('testing semantic cache', async (t) => {

//     // Create a new semantic cache with a 1 sec time to live
//     const cache = new Cache({
//         ttl: 1000
//     });

//     await cache.init();

//     let query;
//     let response;
//     let isSemantic = true;
//     let d;

//     query = 'What is the speed of a turtle?';
//     response = 250;
    
//     d = await cache.set({ query, response, isSemantic });
//     t.equal(d.response, response, "6. SET semantic query");

//     d = await cache.get({ query, isSemantic });
//     t.equal(d.response, response, "7. GET semantic query");

//     d = await cache.get({ 
//         query: 'How fast does a turtle move?', 
//         isSemantic 
//     });
//     t.equal(d.response, response, "7. GET semantic query");

//     t.equal(await cache.has({ query }), true, "10. HAS non-semantic query");

//     query = 'What is the speed of a swallow?';
//     response = 500;
//     d = await cache.set({ query, response, isSemantic });
//     t.equal(d.response, response, "9. SET semantic query");

//     d = await cache.get({ 
//         query: 'How fast does the swallow fly?', 
//         isSemantic 
//     });
//     t.equal(d.response, response, "12. GET semantic query");

//     setTimeout(async function() {
//         const d = await cache.get({ 
//             query: 'What is the speed of a swallow?', 
//             isSemantic
//         });
//         t.equal(d, false, "13. GET wait 1.1s so the expired query is removed");
//     }, 1100);

//     query = 'Capital of France';
//     response = 'Paris';
//     d = await cache.set({ query, response });
//     t.equal(d.response, response, "14. SET non-semantic query");

//     d = await cache.queries({});
//     t.same(
//         d, 
//         [ "Capital of France" ], 
//         "15. QUERIES list non-semantic queries in cache"
//     );

//     d = await cache.queries({ isSemantic });
//     t.same(
//         d, 
//         [ 
//             "What is the speed of a swallow?",
//             "What is the speed of a turtle?"
//          ], 
//         "16. QUERIES list semantic queries in cache"
//     );

//     d = await cache.del({ query });
//     t.equal(d, true, "17. DEL non-semantic query");

//     query = 'Water boils at';
//     response = 100;
//     d = await cache.set({ query, response });
//     t.equal(d.response, response, "18. SET non-semantic query");

//     d = await cache.delete({});
//     t.equal(d, false, "19. DELETE no query provided");

//     d = await cache.delete({ query });
//     t.equal(d, true, "20. DELETE non-semantic query");

//     d = await cache.set({ query, response });
//     t.equal(d.response, response, "21. SET non-semantic query");

//     setTimeout(async function() {
//         const d = await cache.get({ query });
//         t.equal(d, false, "22. GET wait 1s, then remove expired query");
//     }, 1100);

//     d = await cache.prune({});
//     t.equal(d, 0, "23. PRUNE remove expired non-semantic queries");

//     setTimeout(async function() {
//         const d = await cache.queries({});
//         t.same(d, [], "24. QUERIES wait 5 seconds, then list queries in cache");
//     }, 5000);

//     d = await cache.set({ query, response });
//     t.equal(d.response, 100, "25. SET non-semantic query");

//     setTimeout(async function() {
//         const d = await cache.prune({});
//         t.equal(d, 0, "26. PRUNE wait 1s, then remove expired non-semantic queries");
//     }, 1100);

//     query = 'How long does time live?';
//     response = 'forever';
//     ttl = -1;
//     d = await cache.set({ query, response, ttl });
//     t.equal(d.response, 'forever', "27. SET non-semantic forever query");

//     setTimeout(async function() {
//         const d = await cache.prune({});
//         t.equal(d, 0, "28. PRUNE wait 1s, then remove expired non-semantic queries");
//     }, 1100);
//     t.end();
// })


t.skip('testing cache expiry', async (t) => {
    t.plan(3);

    // Create a new semantic cache with a 1 sec time to live
    const cache = new Cache({
        ttl: 1000
    });

    await cache.init();

    let query = 'What is the speed of a turtle?';
    let response = 250;
    let isSemantic = true;
    let d = await cache.set({ query, response, isSemantic });
    t.equal(d.response, response, "SET semantic query");

    d = await cache.get({ 
        query: 'How fast does the turtle move?', 
        isSemantic 
    });
    t.equal(d.response, response, "GET semantic query");

    setTimeout(async function() {
        const d = await cache.get({ query, isSemantic });
        t.equal(d, false, "GET wait 1.1s so the expired query is removed");
    }, 1100);
    
});

t.skip('testing cache prune', async (t) => {
    t.plan(4);

    // Create a new semantic cache with a 1 sec time to live
    const cache = new Cache({
        ttl: 1000
    });

    await cache.init();

    let isSemantic = true;
    let d = await cache.set({ 
        query: 'What is the speed of a turtle?', 
        response: 250, 
        isSemantic 
    });
    t.equal(d.response, 250, "SET semantic query");

    d = await cache.set({ 
        query: 'What is the boiling point of water?', 
        response: 100
    });
    t.equal(d.response, 100, "SET semantic query");

    d = await cache.prune({ isSemantic });
    t.equal(d, 0, "PRUNE expired semantic queries");

    setTimeout(async () => {
        const d = await cache.prune({ });
        t.equal(d, 1, "PRUNE expired non-semantic queries");
    }, 1100)
    
    
});


// t.test('testing cache', async (t) => {

//     // Create a new semantic cache with a 1 sec time to live
//     const cache = new Cache({
//         ttl: 1000
//     });

//     await cache.init();
    
//     let res = await cache.set('What is the speed of a turtle?', 'slow');
//     t.equal(res, 'slow', "set query 1");

//     res = await cache.set('Boiling point of water', 100);
//     t.equal(res, 100, "set query 2");

//     setTimeout(async function() {
//         res = await cache.prune();
//         t.equal(res, 2, "prune expired queries");
//     }, 1100);

//     res = await cache.queries();
//     t.equal(res.length, 0, "queries in cache");

//     t.end();
// });