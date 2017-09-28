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
