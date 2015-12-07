//this shim is needed for IE9-11

var Symbol;
if (!Symbol) {
    Symbol = (function (Object) {

        var objectPrototype = Object.prototype,
            defineProperty = Object.defineProperty,
            prefix = '__simbol' + Math.random() + '__',
            id = 0;

        function get() {/*avoid set w/out get prob*/ }

        function Symbol() {
            var __symbol__ = prefix + id++;
            defineProperty(objectPrototype, this._ = __symbol__,
                {
                  enumerable: false,
                  configurable: false,
                  get: get, // undefined
                  set: function (value) {
                      defineProperty(this, __symbol__, {
                          enumerable: false,
                          configurable: true,
                          writable: true,
                          value: value
                      });
                  }
              }
            );
        }

        Symbol.prototype.toString = function toString() {
            return this._;
        };
        //defineProperty(Symbol.prototype, 'toString', {
        //    enumerable: false,
        //    configurable: false,
        //    writable: false,
        //    value: function toString() {
        //        return this._;
        //    }
        //});

        //  Symbol.iterator = Symbol('iterator');

        return Symbol;

    }(Object));
}

Array.prototype['@@iterator'] = function () {
    var arr = this;
    var idx = -1;

    return {
        next: function () {
            idx++;
            if (arr.length <= idx) {
                return { value: undefined, done: true };

            } else {
                return {
                    value: arr[idx], done: false
                };
            }
        }
    }
};
