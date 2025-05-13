import { Cache } from './index.js';

// Create a new semantic cache
const cache = new Cache();

const query1 = 'What is the speed of a swallow?';
const answer1 = 500;
const isSemantic = true;

console.log(`set: ${query1} ->`, await cache.set(query1, answer1, isSemantic));

const query2 = 'What is the speed of a turtle?';
const answer2 = 250;
console.log(`set: ${query2} ->`, await cache.set(query2, answer2, isSemantic));

console.log(`get: ${query1} ->`, await cache.get(query1, isSemantic));

const query3 = 'How fast does the swallow fly?';
console.log(`get: ${query3} ->`, await cache.get(query3, isSemantic));

const query4 = 'How fast does the turtle move?';
console.log(`get: ${query4} ->`, await cache.get(query4, isSemantic));

console.log('keys: ', await cache.keys());
console.log('queries: ', await cache.queries());
console.log(`has: ${query1} ->`, await cache.has(query1));
console.log(`prune: -> pruned `, await cache.prune(), ' entries');