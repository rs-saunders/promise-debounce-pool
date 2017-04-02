# promise-pool

Maintains a pool of promises that are 'pending' so that multiple calls return that same promise.

The same pending promise is returned for all calls to get it from the pool until it resolves/rejects,
at which point on the next call, it creates a new promise

This is useful if you want to limit the number of identical api requests in quick succession.

Calls between different promises in the pool are chained synchronously (one after the other).
If a call to get a promise from the pool occurs while different promise (one with a different key) is 'pending'
the second call is waits for the other 'pending' promise to resolve/reject before starting.
(it chains the second call using .then off of the previous call)
The chained promises do not react to or interfere with the previous promise in any way. any data or errors are
passed straight through. The chained promise does not fail if the previous promise fails

## Usage
 
 setup the promise pool:

```
var PromisePool = require('promise-pool');

var promisePool = new PromisePool();

promisePool.set('foo', function(resolve, reject) {
     setTimeout(function() { resolve('foo data') }, 1000);
});

promisePool.set('bar', function(resolve, reject) {
     setTimeout(function() { resolve('bar data') }, 1000);
});
```

using the promise pool:

```
var call1 = promisePool.get('foo'); //starts a new foo promise
var call2 = promisePool.get('foo'); //returns the same pending foo promise
var call3 = promisePool.get('bar'); //waits until foo promise resolved/rejected then creates a new bar promise
var call4 = promisePool.get('bar'); //returns the waiting foo promise

setTimeout(function() {
 var call5 = promisePool.get('foo'); //starts a new foo promise (since previous foo promise has now resolved)
 var call6 = promisePool.get('bar'); //returns the same bar promise from before, now pending
}, 1500);

//RESULTS IN:
//Two foo promises created, with the second foo call sharing the first
//One bar promise created with the second and third bar calls sharing the first
```

## Tests:

```
npm install
npm test
```

## Methods:

### set
```
Set the promise resolver

@param {*} key - used to identify the promise when getting/setting
@param {function} resolver - resolver function used when creating a new promise for this key
```

### get
```
Get a promise from the pool

Logic:
if you call get with a given key, it returns you a promise based on the following:
1) is there already a pending promise for this key, if so return it
2) is there currently a pending promise from another key, if so create a new promise but chain
   onto the pending promise so it happens synchronously
3) create a new promise for this key

@param {*} key - used to identify the promise when getting/setting
@returns {Promise}
```

### isSet
```
Is a promise set in the pool

@param {*} key - used to identify the promise when getting/setting
@returns {boolean}
```

