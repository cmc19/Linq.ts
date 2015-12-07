interface ILinq {
    <T>(data: T[]): LinqProvider<T>;
    Types: any;
    toLinq<T>(data: T[]): LinqProvider<T>;
    LinqProvider: any;
}

export function toLinq<T>(data: T[]) {
    return new LinqProvider<T>(data);
};

var Linq: ILinq = <ILinq>toLinq;
Linq.toLinq = Linq;

var Types = Linq.Types = {
    Boolean: typeof true,
    Number: typeof 0,
    String: typeof "",
    Object: typeof {},
    Undefined: typeof undefined,
    Function: typeof function() { }
};

//IE Support. Shim needed.
if (typeof Symbol['iterator'] == Types.Undefined) {
    Symbol['iterator'] =<any> '@@iterator';
}

declare var intellisense;

var isVs = false;

if (typeof intellisense !== Types.Undefined) {
    isVs = true;
}


export enum SortTypeKind {
    unkown,
    number,
    string,
    bool
}

function getSortTypeKind(obj: any) {
    switch (typeof obj) {
        case Types.Boolean: return SortTypeKind.bool;
        case Types.Number: return SortTypeKind.number;
        case Types.String: return SortTypeKind.string;
        default: return SortTypeKind.unkown;
    }
}

export class LinqProvider<T> implements Iterable<T>   {
    protected _data: Iterable<T>;
    constructor(data: Iterable<T>) {
        this._data = data;
        //IE Support
        this['@@iterator'] = () => {
            return this._getIterator();
        }
    }


    protected *_getIterator(): Iterator<T> {
        console.log('LinqProvider._getIterator');
        for (var d of this._data) {
            yield d;
        }
    }



    [Symbol.iterator](): Iterator<T> {
        return this._getIterator();
        // for (var d of this._data) {
        //     yield d;
        // }
    }

    single() {
        var data = this.toArray();
        if (data.length == 1)
        { return data[0]; }
        else throw "Array length is not 1";
    }

    singleOrDefault(d: T = null) {
        var data = this.toArray();
        if (data.length == 1)
        { return data[0]; }
        else return d;
    }

    first() {
        for (var d of this) {
            return d;
        }
        throw 'data is empty';
    }

    firstOrDefault(def: T = null) {
        for (var d of this) {
            return d;
        }
        return def;
    }

    toArray() {
        var arr: T[] = [];
        for (var d of this) {
            arr.push(d);
        }
        return arr;
    }

    toLookup<TKey, TValue>(fnKey: (d: T) => TKey, fnValues: (d: T) => TValue[]) {
        if (isVs) {
            var first = this.firstOrDefault();
            fnKey(first);
            fnValues(first);
        }

        var l = new Lookup<TKey, TValue>();

        for (let i of this) {
            l.addRange(fnKey(i), fnValues(i));
        }

        return l;
    }



    where(fn: (d: T) => boolean) {
        if (isVs) {
            fn(this.firstOrDefault());
        }

        return new LinqProvider<T>(this._getWhere(fn));
    }

    toPairs(mode: PairMode = PairMode.Default) {
        return new LinqProvider<IPair<T>>(this._getPairs(mode));
    }

    orderBy(fn: (d: T) => any): OrderDataProvider<T> {

        if (isVs) {
            fn(this.firstOrDefault());
        }

        var data = this.toArray();


        var od = new OrderDetail();
        od.getFunction = fn;
        if (data.length != 0)
            od.kind = getSortTypeKind(fn(data[0]));

        var op = new OrderDataProvider(data, [od]);

        return op;
    }

    sum(fn: (d: T) => number) {
        if (isVs) {
            fn(this.firstOrDefault());
        }

        var res = 0;
        for (var i of this) {
            res += fn(i);
        }
        return res;
    }

    select<TOut>(fn: (d: T) => TOut) {
        if (isVs) {
            fn(this.firstOrDefault());
        }

        return new LinqProvider<TOut>(this._getSelect(fn));
    }

    distinct(fn: (d: T) => any = d=> d) {
        if (isVs) {
            fn(this.firstOrDefault());
        }

        return new LinqProvider<T>(this._getDistinct(fn));
    }

    contains(item: T): boolean {
        for (let i of this) {
            if (i === item) return true;
        }
        return false;
    }

    private *_getDistinct(fn: (d: T) => any): Iterable<T> {
        var hash = {};

        for (let x of this) {
            var fnResult = fn(x);
            if (hash[fnResult] === 1) {
                continue;
            }
            hash[fnResult] = 1;
            yield x;
        }
    }

    private *_getWhere(fn: (d: T) => boolean): Iterable<T> {
        for (var x of this) {
            if (fn(x)) {
                yield x;
            }
        }
    }

    private *_getSelect<TOut>(fn: (d: T) => TOut) {
        for (let x of this) {
            yield fn(x);
        }
    }

    private *_getPairs(mode: PairMode): Iterable<IPair<T>> {
        switch (mode) {
            case PairMode.Default:
                {
                    var last: T = null;
                    for (let x of this) {
                        if (last != null) {
                            yield {
                                a: last,
                                b: x
                            };
                        }
                        last = x;
                    }
                    return;
                }
            case PairMode.lastNull: {
                var last: T = null;
                for (let x of this) {
                    if (last != null) {
                        yield {
                            a: last,
                            b: x
                        };
                    }
                    last = x;
                }
                yield {
                    a: last,
                    b: null
                };

                return;
            }
            default:
                throw 'mode not known';
        }

    }
}


export class OrderDetail {
    getFunction: (d: any) => any;
    kind: SortTypeKind;
}



export class OrderDataProvider<T> extends LinqProvider<T>  {
    private _array: T[];
    private _orderDetails: OrderDetail[];

    /**
     * @param data {T[]} needs to be an array. length property is used
     */
    constructor(data: T[], orderDetails: OrderDetail[] = []) {
        super(data);
        this._array = data;
        this._orderDetails = orderDetails;
    }

    protected *_getIterator(): Iterator<T> {
        console.log('OrderDataProvider._getIterator');
        var data = this.toArray();
        for (var i of data) {
            yield i;
        }
    }

    orderBy(fn: (d: T) => any): OrderDataProvider<T> {
        throw 'Must call thenBy in an orderby context';
    }

    thenBy(fn: (d: T) => any) {

        if (isVs) {
            fn(this.firstOrDefault());
        }

        var data = this._array;


        var od = new OrderDetail();
        od.getFunction = fn;
        if (data.length != 0)
            od.kind = getSortTypeKind(fn(data[0]));

        var arr: OrderDetail[] = [];
        for (let o of this._orderDetails) {
            arr.push(o);
        }
        arr.push(od);

        var op = new OrderDataProvider(data, arr);

        return op;
    }

    toArray() {
        if (this._array.length == 0) return this._array;

        var data = this._array.sort((a: any, b: any) => {
            var out;
            for (let od of this._orderDetails) {
                switch (od.kind) {
                    case SortTypeKind.number:
                        out = od.getFunction(a) - od.getFunction(b);
                        break;
                    case SortTypeKind.string:
                        out = (<string>od.getFunction(a)).localeCompare(<string>od.getFunction(b));
                        break;

                    case SortTypeKind.bool:
                    case SortTypeKind.unkown:
                        throw 'not implemented';
                }
                if (out != 0) {
                    return out;
                }
            }

        });

        return data;
    }


}

interface LookupMap<TValue> {
    [key: number]: TValue[];
    [key: string]: TValue[];
}

export interface ILookupKeyValues<TKey, TValue> {
    key: TKey;
    value: TValue[];
}

export class Lookup<TKey, TValue> extends LinqProvider<ILookupKeyValues<TKey, TValue>> {
    private _map: LookupMap<TValue> = {};

    constructor() {
        super(null);
    }

    protected *_getIterator(): Iterator<ILookupKeyValues<TKey, TValue>> {
        console.log('LinqProvider._getIterator');
        for (var key in this._map) {
            var d = this._map[key];
            yield { key: key, value: d };
        }
    }

    private _getArray(k: TKey): TValue[] {
        var st = getSortTypeKind(k);
        switch (st) {
            case SortTypeKind.unkown:
            case SortTypeKind.bool:
                throw 'Lookup Key must be String or Number';
        }

        var arr = this._map[<any>k];
        if (typeof arr === Types.Undefined) {
            arr = this._map[<any>k] = [];
        }

        return arr;
    }

    add(k: TKey, v: TValue) {
        var arr = this._getArray(k);
        arr.push(v);
    }

    addRange(k: TKey, v: TValue[]) {
        var arr = this._getArray(k);

        for (let i of v) {
            arr.push(i);
        }
    }

    get(k: TKey) {
        return this._getArray(k);
    }

    toObject(): any {
        return this._map;
    }

}

export enum PairMode {
    Default,
    firstNull,
    lastNull,
    bothNull
}

export interface IPair<T> {
    a: T;
    b: T;
}

Linq.LinqProvider = LinqProvider;
