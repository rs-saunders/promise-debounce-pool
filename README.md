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
 

```
var PromisePool = require('promise-pool');

// create a promise resolver function for
// each of your expensive operations 

var expensiveFooOperation = function(resolve, reject) {
   setTimeout(function() { resolve('foo data') }, 1000);
};

var expensiveBarOperation = function(resolve, reject) {
   setTimeout(function() { resolve('bar data') }, 1000);
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
         //...
    }); 

var fooCall2 = promisePool.get('foo') //returns the same pending foo promise (fooCall1)
    .then(function(fooData) {
        //... (same data from fooCall1)
    }); 
    
var barCall1 = promisePool.get('bar') //waits until fooCall1 promise resolved/rejected then creates a new bar promise
    .then(function(barData) {
        //...
    }); 
    
var barCall2 = promisePool.get('bar'); //returns the same pending bar promise (barCall1)
    .then(function(barData) {
        //... (same data from barCall1)
    }); 

setTimeout(function() {

 var fooCall3 = promisePool.get('foo'); //starts a new foo promise (since previous fooCall1 promise has now resolved)
    .then(function(fooData) {
        //... (data from new fooBar3 call)
    }); 


 var barCall3 = promisePool.get('bar'); //returns the same fooCall1 promise from before, its still pending
    .then(function(barData) {
        //... (same data from barCall1)
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
`fn` resolver function used when creating a new promise for this key


##### get
` var promise = promisePool.get(key)`

Get a promise from the pool

`key` used to identify the promise when getting/setting

If you call `get` with a given `key`, it returns you a `promise` based on the following:
1) is there already a pending promise for this `key`, if so return it
2) is there currently a pending promise from another `key`, if so create a new promise but chain
   onto the pending promise so it happens synchronously
3) create a new promise for this key


##### isSet
` var isSet = promisePool.isSet(key)`

Is a promise resolver set in the pool

`key` used to identify the promise in the pool \
`isSet` returns a boolean


### Limitations
Since your setting the promise resolver into the pool ahead of time (without it actually being invoked then),
when the time comes that you want the promise to invove (promisePool.get) you can't pass any different argumets to it.

i.e. each call to `get` will be the same pre determined action ahead of time.

