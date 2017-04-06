var PromisePool = require('../promise-pool');

describe("PromisePool", function() {
    describe("call to get", function() {

        it('returns a resolved promise with data from the resolver', function(done) {
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

        it('returns a rejected promise with error from the resolver', function(done) {
            var expectedError = 'error returned from promise';
            var promisePool = new PromisePool();
            promisePool.set('promise_key_here', function(resolve, reject) {
                reject(expectedError);
            });
            promisePool.get('promise_key_here')
                .then(function () {
                    throw new Error('promise did not reject');
                })
                .catch(function(actualError) {
                    expect(actualError).toBe(expectedError);
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

        it('calls the resolver', function(done) {
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

    describe('multiple calls to get while promise still pending', function () {

        it('returns same resolved promise with data from the resolver', function(done) {
            var expectedData = 'data returned from promise';
            var promisePool = new PromisePool();
            var observer = {
                resolver: function(resolve) {
                    setTimeout(function() { resolve(expectedData) }, 100);
                }
            };
            var resolverSpy = spyOn(observer, 'resolver').and.callThrough();

            jasmine.clock().install();
            promisePool.set('promise_key_here', resolverSpy);
            promisePool.get('promise_key_here')
                .then(function(actualData) {
                    expect(actualData).toBe(expectedData);
                });

            promisePool.get('promise_key_here')
                .then(function(actualData) {
                    expect(actualData).toBe(expectedData);
                });

            promisePool.get('promise_key_here')
                .then(function(actualData) {
                    expect(actualData).toBe(expectedData);
                    done();
                });

            jasmine.clock().tick(101);
            jasmine.clock().uninstall();
        });

        it('only calls the resolver once', function(done) {
            var expectedData = 'data returned from promise';
            var promisePool = new PromisePool();
            var observer = {
                resolver: function(resolve) {
                    setTimeout(function() { resolve(expectedData) }, 100);
                }
            };
            var resolverSpy = spyOn(observer, 'resolver').and.callThrough();

            jasmine.clock().install();
            promisePool.set('promise_key_here', resolverSpy);
            promisePool.get('promise_key_here');
            promisePool.get('promise_key_here');

            promisePool.get('promise_key_here')
                .then(function() {
                    expect(resolverSpy).toHaveBeenCalledTimes(1);
                    done();
                });

            jasmine.clock().tick(101);
            jasmine.clock().uninstall();
        });

        it('returns same rejected promise with error from the resolver', function(done) {
            var expectedError = 'error returned from promise';
            var promisePool = new PromisePool();

            jasmine.clock().install();
            promisePool.set('promise_key_here', function(resolve, reject) {
                setTimeout(function() { reject(expectedError); }, 100);
            });

            promisePool.get('promise_key_here')
                .then(function () {
                    throw new Error('promise did not reject');
                })
                .catch(function(actualError) {
                    expect(actualError).toBe(expectedError);
                });

            promisePool.get('promise_key_here')
                .then(function () {
                    throw new Error('promise did not reject');
                })
                .catch(function(actualError) {
                    expect(actualError).toBe(expectedError);
                });

            promisePool.get('promise_key_here')
                .then(function () {
                    throw new Error('promise did not reject');
                })
                .catch(function(actualError) {
                    expect(actualError).toBe(expectedError);
                    done();
                });

            jasmine.clock().tick(101);
            jasmine.clock().uninstall();
        });
    });

    describe('multiple calls to get after promise resolved', function () {

        it('returns new resolved promises with data from the resolver', function(done) {
            var increment = 0;
            var promisePool = new PromisePool();
            var observer = {
                resolver: function(resolve) {
                    resolve(++increment);
                }
            };
            var resolverSpy = spyOn(observer, 'resolver').and.callThrough();

            promisePool.set('promise_key_here', resolverSpy);
            promisePool.get('promise_key_here')
                .then(function(actualData) {

                    expect(actualData).toBe(1);
                    expect(resolverSpy).toHaveBeenCalledTimes(1);

                    promisePool.get('promise_key_here')
                        .then(function(actualData) {

                            expect(actualData).toBe(2);
                            expect(resolverSpy).toHaveBeenCalledTimes(2);

                            promisePool.get('promise_key_here')
                                .then(function (actualData) {
                                    expect(actualData).toBe(3);
                                    expect(resolverSpy).toHaveBeenCalledTimes(3);
                                    done();
                                });
                        });
                });
            });
    });
});
