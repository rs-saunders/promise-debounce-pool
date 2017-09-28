(function(f) {
    if (typeof exports === 'object' && typeof module !== 'undefined') { module.exports = f(); }
    else if (typeof define === 'function' && define.amd) { define([], f); }
    else {
        var g;
        if (typeof window !== 'undefined') { g = window; }
        else if (typeof global !== 'undefined'){ g = global; }
        else if (typeof self !== 'undefined'){ g = self; }
        else { g = this; }
        g.PromisePool = f();
    }
})(function() {
    
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
        var _arguments = arguments;
        var argumentsLength = _arguments.length;
    
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
    
            if (argumentsLength > 1) {
                resolver = deCurryResolver(resolver);
    
                if (typeof resolver !== 'function') {
                    return Promise.reject(
                        new TypeError('Curried promise resolver ' + resolver + ' is not a function for key ' + key)
                    );
                }
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
    
        function deCurryResolver(curry) {
            var curryArgs = [];
    
            for(var i = 1; i < argumentsLength; i++) {
                curryArgs.push(_arguments[i]);
            }
    
            return curry.apply(null, curryArgs);
        }
    };
    
    return PromisePool;
});
