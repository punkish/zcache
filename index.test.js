import tap from 'tap';
import { Cache } from './index.js';

const key1 = 'foo';
const key2 = 'biome=Tropical%20and%20Subtropical%20Coniferous%20Forests&yearlyCounts=true&page=1&size=30&cols=treatmentId&cols=treatmentTitle&cols=zenodoDep&cols=treatmentDOI&cols=articleTitle&cols=articleAuthor&cols=httpUri&cols=caption';

const val = {
    item: { a: 'foo', b: 'bar', c: 'baz' }
};

const cache = new Cache();

let res1 = cache.get(key1);
console.log('should be "false" because never stored');
console.log(res1, '\n');

console.log('should be "false" because never stored');
res1 = cache.get(key2);
console.log(res1, '\n');

console.log('should be "val{}" because set now');
res1 = cache.set(key2, val);
console.log(res1, '\n');

console.log('should be "val{}" from get because stored earlier');
res1 = cache.get(key2);
console.log(res1, '\n');

const updated_val = JSON.parse(JSON.stringify(res1.item));
updated_val.item.a = 'qux';
res1 = cache.set(key2, updated_val);
console.log(`should be "val{ a: 'qux' }" from another set with modified value`);
console.log(res1, '\n');

res1 = cache.get(key1);
console.log('should be "false" because still not stored');
console.log(res1, '\n');

console.log(`should be "true" because 'has' key stored earlier`);
res1 = cache.has(key2);
console.log(res1, '\n');

console.log(`should be "true" because 'removed' succesfully`);
res1 = cache.rm(key2);
console.log(res1, '\n');

console.log('should be "val{}" because set once again');
res1 = cache.set(key2, val);
console.log(res1, '\n');

console.log(`should be "true" because 'deleted' succesfully`);
res1 = cache.delete(key2);
console.log(res1, '\n');

console.log(`should be "false" because does not 'has' key anymore`);
res1 = cache.has(key2);
console.log(res1, '\n');

console.log('should be "val{}" because set the third time');
res1 = cache.set(key2, val);
console.log(res1, '\n');

console.log('all the keys');
res1 = cache.keys();
console.log(res1, '\n');

console.log('should be "val{}" because set the 4th time with 5ms ttl');
res1 = cache.set(key2, val, 5);
console.log(res1, '\n');

setTimeout(function () {
    res1 = cache.get(key1);
    console.log('should be "false" because stale');
    console.log(res1, '\n');
}, 100);

res1 = cache.opts();
console.log('cache options');
console.log(res1, '\n');
// tap.test('zcache', tap => {
//     tap.same(cache.get(key1), false, 'should be false, not stored');
//     tap.same(cache.get(key2), false, 'should be false, not stored');
//     tap.match(cache.set(key2, val), { item: { a: 'foo', b: 'bar', c: 'baz' } }, 'should be val because stored now');
//     tap.match(cache.get(key2), { item: { a: 'foo', b: 'bar', c: 'baz' } }, 'should be val because stored earlier');
//     tap.same(cache.get(key1), false, 'should still be false, never stored');
//     tap.end();
// });