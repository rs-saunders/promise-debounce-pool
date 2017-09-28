# promise-debounce-pool

Maintains a pool of leading edge debounced promises.

This is useful if you want to limit MULTIPLE expensive (but independant) operations (such as api calls) and only 
have one occur at any one time (synchronously)

You `set` the promise resolver you want to debounce and when you `get` it, the pool actually handles creating the promise, and then
only when it needs to. If one is already pending for that key, it returns that.

Calls between different promise resolvers (different keys) in the pool are chained synchronously (one after the other).
If a call to get a promise from the pool occurs while another promise (one with a different key) is 'pending'
then the second call is waits for the other 'pending' promise to resolve/reject before starting.

The chained promises do not react to or interfere with the previous promise in any way. 
i.e. The chained promise does not fail if the previous promise fails, nor does the returned data bleed into the 
second call

## Example Usage

[![Try promise-debounce-pool on RunKit](https://badge.runkitcdn.com/promise-debounce-pool.svg)](https://npm.runkit.com/promise-debounce-pool)

```js
var PromisePool = require("promise-debounce-pool");

// create a promise resolver function for
// each of your expensive operations

var expensiveFooOperation = function(resolve, reject) {
   setTimeout(function() { resolve('foo data ' + Math.random()) }, 1000);
};

var expensiveBarOperation = function(resolve, reject) {
   setTimeout(function() { resolve('bar data ' + Math.random()) }, 1000);
};

// create an instance of the pool
var promisePool = new PromisePool();

// associate each promise resolver to a key in the pool
// Note: the functions are not invoked at this point
promisePool.set('foo', expensiveFooOperation);
promisePool.set('bar', expensiveBarOperation);

// make multiple calls

var fooCall1 = promisePool.get('foo') //starts a new foo promise
    .then(function(fooData) {
         console.log('fooCall1: ' + fooData);
    });

var fooCall2 = promisePool.get('foo') //returns the same pending foo promise (fooCall1)
    .then(function(fooData) {
        console.log('fooCall2: ' + fooData); //same data from fooCall1
    });

var barCall1 = promisePool.get('bar') //waits until fooCall1 promise resolved/rejected then creates a new bar promise
    .then(function(barData) {
        console.log('barCall1: ' + barData);
    });

var barCall2 = promisePool.get('bar') //returns the same pending bar promise (barCall1)
    .then(function(barData) {
        console.log('barCall2: ' + barData); // same data from barCall1
    });

setTimeout(function() {

 var fooCall3 = promisePool.get('foo') //starts a new foo promise (since previous fooCall1 promise has now resolved)
    .then(function(fooData) {
        console.log('fooCall3: ' + fooData); // data from new fooCall3 promise
    });


 var barCall3 = promisePool.get('bar') //returns the same fooCall1 promise from before, its still pending
    .then(function(barData) {
        console.log('barCall3: ' + barData); // same data from barCall1
    });

}, 1500);


//RESULTS IN:
// expensiveFooOperation called twice. 
//   Once for fooCall1 & fooCall2 because fooCall1 was still pending whn fooCall2 occurred
//   Then again for fooCall3 because fooCall1 had resolved by the time fooCall3 occurred. 
//
// expensiveBarOperation called only once
//   This occurred after the first call to expensiveFooOperation completed. 
//   All three bar calls shared the same promise becuase they all occurred before barCall1 had resolved.
```

## Tests:

```
npm install
npm test
```

## API:

##### set
` promisePool.set(key, fn)` 

Set the promise resolver

`key` used to identify the promise when getting/setting \
`fn` resolver function used when creating a new promise for this key. e.g.\
```js
promisePool.set('someKey', function(resolve, reject) {
    //...
    resolve();
})
```

`fn` can optionally be curried if you want to pass other arguments to it when it is invoked.
In this case the function passed to `set` must return the resolver function.

```js
promisePool.set('someKey', function yummyCurry(curriedArg1, curriedArg2) {
    return function resolver(resolve, reject) {
        //...
        resolve();
    };
});

promisePool.get('someKey', 'curriedValue1', 'curriedValue2')
    .then(
        //...
     );
```



##### get
` var promise = promisePool.get(key, [curriedArg], [...])`

Get a promise from the pool

`key` used to identify the promise when getting/setting \
Optionally you can pass multiple `curriedArg` which will be passed on to the curried promise resolver.
If you pass more arguments to get then you must curry the resolver when.

If you call `get` with a given `key`, it returns you a `promise` based on the following:
1) is there already a pending promise for this `key`, if so return it
2) is there currently a pending promise from another `key`, if so create a new promise but chain
   onto the pending promise so it happens synchronously
3) create a new promise for this key

**Note**: since multiple calls share pending promises, if you make multiple calls with different curried args
while the first is still pending, then the other calls will still share the first call's promise and curried args. e.g.

```js
promisePool.set('someKey', function yummyCurry(curriedArg1, curriedArg2) {
    return function resolver(resolve, reject) {
        setTimeout(function() { resolve() }, 1000);
    };
});

var call1 = promisePool.get('someKey', 'curriedValue1', 'curriedValue2')
    .then(
        //...
     );

var call2 = promisePool.get('someKey', 'curriedValue3', 'curriedValue4')
    .then(
        // ... (data from call1 with call1's curried args, since call1 was stil pending)
     );
```

##### isSet
` var isSet = promisePool.isSet(key)`

Is a promise resolver set in the pool

`key` used to identify the promise in the pool \
`isSet` returns a boolean

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
