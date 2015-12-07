var Types = {
    Boolean: typeof true,
    Number: typeof 0,
    String: typeof "",
    Object: typeof {},
    Undefined: typeof undefined,
    Function: typeof function() { }
};

export enum TypeKind {
    unkown,
    number,
    string,
    bool
}

function getTypeKind(obj: any) {
    switch (typeof obj) {
        case Types.Boolean: return TypeKind.bool;
        case Types.Number: return TypeKind.number;
        case Types.String: return TypeKind.string;
        default: return TypeKind.unkown;
    }
}

export class LinqProvider<T> implements Iterable<T>   {

    constructor(private data: Iterable<T>) {

    }


    *[Symbol.iterator](): Iterator<T> {
        for (var d of this.data) {
            yield d;
        }
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
        for (var d of this.data) {
            return d;
        }
        throw 'data is empty';
    }

    firstOrDefault(def: T = null) {
        for (var d of this.data) {
            return d;
        }
        return def;
    }

    toArray() {
        var arr: T[] = [];
        for (var d of this.data) {
            arr.push(d);
        }
        return arr;
    }

    where(fn: (d: T) => boolean) {
        return new LinqProvider<T>(this.GetWhere(fn));
    }

    toPairs(mode: PairMode = PairMode.Default) {
        return new LinqProvider<IPair<T>>(this.GetPairs(mode));
    }

    orderBy(fn: (d: T) => any) {

        var data = this.toArray();


        var od = new OrderDetail();
        od.getFunction = fn;
        if (data.length != 0)
            od.kind = getTypeKind(fn(data[0]));

        var op = new OrderDataProvider(data, [od]);

        return op;
    }

    sum(fn: (d: T) => number) {
        var res = 0;
        for (var i of this) {
            res += fn(i);
        }
        return res;
    }

    select<TOut>(fn: (d: T) => TOut) {
        return new LinqProvider<TOut>(this.GetSelect(fn));
    }

    private *GetWhere(fn: (d: T) => boolean): Iterable<T> {
        for (var x of this.data) {
            if (fn(x)) {
                yield x;
            }
        }
    }

    private *GetSelect<TOut>(fn: (d: T) => TOut) {
        for (let x of this.data) {
            yield fn(x);
        }
    }

    private *GetPairs(mode: PairMode): Iterable<IPair<T>> {
        switch (mode) {
            case PairMode.Default:
                {
                    var last: T = null;
                    for (let x of this.data) {
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
                for (let x of this.data) {
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


class OrderDetail {
    getFunction: (d: any) => any;
    kind: TypeKind;
}

export class OrderDataProvider<T> {
    private _data: T[];
    private _orderDetails: OrderDetail[];

    constructor(data: T[], orderDetails: OrderDetail[] = []) {
        this._data = data;
        this._orderDetails = orderDetails;
    }

    thenBy(fn: (d: T) => any) {

        var data = this._data;


        var od = new OrderDetail();
        od.getFunction = fn;
        if (data.length != 0)
            od.kind = getTypeKind(fn(data[0]));

        var arr: OrderDetail[] = [];
        for (let o of this._orderDetails) {
            arr.push(o);
        }
        arr.push(od);

        var op = new OrderDataProvider(data, arr);

        return op;
    }

    toArray() {
        if (this._data.length == 0) return this._data;

        var data = this._data.sort((a: any, b: any) => {
            var out;
            for (let od of this._orderDetails) {
                switch (od.kind) {
                    case TypeKind.number:
                        out = od.getFunction( a) - od.getFunction(b);
                        break;
                    case TypeKind.string:
                        out = (<string>od.getFunction(a)).localeCompare(<string>od.getFunction(b));
                        break;

                    case TypeKind.bool:
                    case TypeKind.unkown:
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


export enum PairMode {
    Default,
    firstNull,
    lastNull,
    bothNull
}

interface IPair<T> {
    a: T;
    b: T;
}


export function toLinq<T>(data: T[]) {
    return new LinqProvider<T>(data);
}
