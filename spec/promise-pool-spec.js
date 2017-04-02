var PromisePool = require('../promise-pool');

describe("PromisePool", function() {
    describe("get", function() {

        it('returns the data from the set promise resolver', function(done) {
            var expectedData = 'data returned from promise';
            var promisePool = new PromisePool();
            promisePool.set('promise_key_here', function(resolve) {
                resolve(expectedData);
            });
            promisePool.get('promise_key_here')
                .then(function(actualData) {
                    expect(actualData).toBe(expectedData);
                    done();
                });
        });

        it("returns rejected promise if no resolver set", function (done) {

            var promisePool = new PromisePool();
            promisePool.get('promise_key_here')
                .then(function () {
                    throw new Error('promise did not reject');
                })
                .catch(function (actualError) {
                    expect(actualError.name).toBe('TypeError');
                    expect(actualError.message).toBe(
                        'Promise resolver undefined is not a function for key promise_key_here'
                    );
                    done();
                });
        });

        it('returns rejected promise if resolver is not a function', function (done) {
            var promisePool = new PromisePool();
            promisePool.set('promise_key_here', 'not_a_function');
            promisePool.get('promise_key_here')
                .then(function () {
                    throw new Error('promise did not reject');
                })
                .catch(function (actualError) {
                    expect(actualError.name).toBe('TypeError');
                    expect(actualError.message).toBe(
                        'Promise resolver not_a_function is not a function for key promise_key_here'
                    );
                    done();
                });
        });

        it('uses the set resolver', function(done) {
            var promisePool = new PromisePool();
            var observer = {
                resolver: function(resolve) {
                    resolve();
                }
            };
            var resolverSpy = spyOn(observer, 'resolver').and.callThrough();
            promisePool.set('promise_key_here', resolverSpy);
            promisePool.get('promise_key_here')
                .then(function() {
                    expect(resolverSpy).toHaveBeenCalledTimes(1);
                    done();
                });
        });
    });
});
