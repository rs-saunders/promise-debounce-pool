
function PromisePool() {
    this.promise = {};
    this.resolver = {};
}

PromisePool.prototype.isSet = function(key) {
    return typeof this.resolver[key] !== 'undefined';
};

PromisePool.prototype.set = function(key, resolver) {
    this.resolver[key] = resolver;
};

PromisePool.prototype.get = function(key) {

    var _this = this;

    if (this.promise[key]) {
        return this.promise[key];
    }

    if (this.pending) {
        this.promise[key] = this.pending.then(createPromise, createPromise);
        this.pending = this.promise[key];
        return this.promise[key];
    }

    this.promise[key] = createPromise();
    this.pending = this.promise[key];
    return this.promise[key];

    function createPromise() {
        var resolver = _this.resolver[key];
        if (typeof resolver !== 'function') {
            return Promise.reject(
                new TypeError('Promise resolver ' + resolver + ' is not a function for key ' + key)
            );
        }
        return new Promise(resolver)
            .then(function(success) {
                delete _this.promise[key];
                delete _this.pending;
                return success;
            }, function(error) {
                delete _this.promise[key];
                delete _this.pending;
                throw error;
            });
    }
};

module.exports = PromisePool;
