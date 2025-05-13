import { Cache } from './index.js';

// Create a new semantic cache
const cache = new Cache();

//console.log('keys: ', await cache.keys());
// console.log('clear', await cache.clear());
const query1 = 'What is the speed of a swallow?';
const answer1 = 500;
const isSemantic1 = true;
console.log(`set: ${query1} ->`, await cache.set(query1, answer1, isSemantic1));

const query2 = 'What is the speed of a turtle?';
const answer2 = 250;
const isSemantic2 = true;
console.log(`set: ${query2} ->`, await cache.set(query2, answer2, isSemantic2));

console.log(`get: ${query1} ->`, await cache.get(query1));

const query3 = 'How fast does the swallow fly?';
console.log(`get: ${query3} ->`, await cache.get(query3));

const query4 = 'How fast does the turtle move?';
console.log(`get: ${query4} ->`, await cache.get(query4));

console.log('keys: ', await cache.keys());
console.log('queries: ', await cache.queries());
console.log(`has: ${query1} ->`, await cache.has(query1));
console.log(`prune: -> pruned `, await cache.prune(), ' entries');
// setTimeout(async () => { 
//     console.log('get', await cache.get(query1));
// }, 15000);
// console.log('keys', await cache.keys());
// const query2 = 'q=phylogeny';
// const val2 = 'Phylogeny is blah blah blah';
// const ttl2 = 10000;
// console.log('set', await cache.set(key2, val2, ttl2));
// console.log('get', await cache.get(key2));
// console.log('keys', await cache.keys());
// const query3 = 
// console.log('clear', await cache.clear());
// console.log('wait 15s');
// setTimeout(async () => { 
//     console.log('get', await cache.get(key2));
//     console.log('keys', await cache.keys());
//     console.log('clear', await cache.clear());
// }, 15000);

// const array1 = [ 0.6046821846986417,0.7727735494098922,0.12977892073297492,0.6927478712656445,0.508891590943992,0.5028789880123004,0.04040205882823522,0.17363198408571123,0.3162928181053293,0.33902444423033007];
// const array2 = [ 0.01480961123944069,0.7843452234704804,0.48687311617615525,0.08468885802562354,0.04932801689831745,0.5560004223824402,0.9172918089410189,0.48906768565588044,0.8353029797836593,0.45266900725193615];

// const cs = cache.cosineSimilarity(array1, array2);
// console.log(cs)