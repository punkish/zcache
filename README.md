# zcache

A zemantic, ~~no-dependency,~~ file-based cache

There are loads of wonderful, battle-tested caching modules. This is not one of them. But, if you want a ~~no-dependency,~~ semantic file-based cache, this one is for you. A really zimple, zemantic caching module.

Create a cache

```
import { Cache } from '@punkish/zcache';

const options = {
    dir: './',
    name: 'cache',
    space: 'default',
    ttl: 86400000
    similarityThreshold: 0.9
};

const cache = new Cache(options);
```

Cache a semantic query

```
const query1 = 'What is the speed of a swallow?';
const answer1 = 500;
const isSemantic = true;
await cache.set(query1, answer1, isSemantic);
```

Cache a non-semantic query

```
const query2 = 'Half of 1000';
const answer2 = 500;
await cache.set(query2, answer2);
```

Retrieve the values

```
await cache.get(query2);
await cache.get(query1, isSemantic);
```

Retrieve another semantic query

```
const query3 = 'How fast does the swallow fly?';
await cache.get(query3, isSemantic);
```