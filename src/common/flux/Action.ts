/// <reference path="../../../node_modules/rx/ts/rx.all.d.ts"/>
import { Subject } from 'rx';

export interface ActionFunctionBase<T> {
    source:Subject<Action<T>>;
}

export interface ActionFunction extends ActionFunctionBase<ActionFunction>{
    ():void;
}

export interface ActionFunctionSingle<T> extends ActionFunctionBase<T> {
    (payload1:T):void;
}

export interface ActionFunction1<T,V1> extends ActionFunctionBase<T> {
    (payload1:V1):void;
}

export interface ActionFunction2<T,V1,V2> extends ActionFunctionBase<T> {
    (payload1:V1, payload2:V2):void;
}

export interface ActionFunction3<T,V1,V2,V3> extends ActionFunctionBase<T> {
    (payload1:V1, payload2:V2, payload3:V3):void;
}

export interface ActionFunction4<T, V1,V2,V3,V4> extends ActionFunctionBase<T> {
    (payload1:V1, payload2:V2, payload3:V3, payload4:V4):void;
}

export interface ActionFunction5<T,V1,V2,V3,V4,V5> extends ActionFunctionBase<T> {
    (payload1:V1, payload2:V2, payload3:V3, payload4:V4, payload5:V5):void;
}

export class Action<T> {
    private static _source = new Subject<Action<any>>();

    private _payload:T;
    private _action:Function;
    private _name:string;
    constructor(action:Function, payload:T, name:string) {
        this._action = action;
        this._payload = payload;
        this._name = name;
    }

    static get source():Subject<Action<any>> {
        return Action._source;
    }

    static get outObserver():Subject<Action<any>> {
        return Action._source;
    }

    get action():Function {
        return this._action;
    }

    get payload():T {
        return this._payload;
    }

    get name():string {
        return this._name;
    }

    is(action:Function):boolean {
        return this._action == action;
    }

    public static create():ActionFunction;
    public static create(name:string):ActionFunction;

    public static create<ObservableType>():ActionFunctionSingle<ObservableType>;
    public static create<ObservableType>(name:string):ActionFunctionSingle<ObservableType>;

    public static create<ObservableType,T>(mapper:(T) => ObservableType):ActionFunction1<ObservableType,T>;
    public static create<ObservableType,T>(mapper:(T) => ObservableType, name:string):ActionFunction1<ObservableType,T>;

    public static create<ObservableType,T1, T2>(mapper:(T1, T2) => ObservableType):ActionFunction2<ObservableType,T1, T2>;
    public static create<ObservableType,T1, T2>(mapper:(T1, T2) => ObservableType, name:string):ActionFunction2<ObservableType,T1, T2>;

    public static create<ObservableType,T1, T2, T3>(mapper:(T1, T2, T3) => ObservableType):ActionFunction3<ObservableType,T1, T2, T3>;
    public static create<ObservableType,T1, T2, T3>(mapper:(T1, T2, T3) => ObservableType, name:string):ActionFunction3<ObservableType,T1, T2, T3>;

    public static create<ObservableType,T1, T2, T3, T4>(mapper:(T1, T2, T3, T4) => ObservableType):ActionFunction4<ObservableType,T1, T2, T3, T4>;
    public static create<ObservableType,T1, T2, T3, T4>(mapper:(T1, T2, T3, T4) => ObservableType, name:string):ActionFunction4<ObservableType,T1, T2, T3, T4>;

    public static create<ObservableType,T1, T2, T3, T4, T5>(mapper:(T1, T2, T3, T4, T5) => ObservableType):ActionFunction5<ObservableType,T1, T2, T3, T4, T5>;
    public static create<ObservableType,T1, T2, T3, T4, T5>(mapper:(T1, T2, T3, T4, T5) => ObservableType, name:string):ActionFunction5<ObservableType,T1, T2, T3, T4, T5>;

    public static create(mapper:any = null, name:string = null):any {
        if (typeof mapper == 'string') {
            name = mapper;
            mapper = null;
        }
        return (function () {
            var func:any = function (...payloads:any[]):void {
                if (payloads.length == 0) {
                    Action.outObserver.onNext(new Action(func, null, name));
                } else if (payloads.length == 1) {
                    if (mapper == null) {
                        Action.outObserver.onNext(new Action(func, payloads[0], name));
                    } else {
                        Action.outObserver.onNext(new Action(func, mapper.call(null, payloads[0]), name));
                    }
                } else {
                    if (mapper == null) {
                        throw 'If more than one payload given, a mapper function is needed';
                    } else {
                        Action.outObserver.onNext(new Action(func, mapper.apply(null, payloads), name));
                    }
                }
            };
            func.source = Action.source;

            return func;
        })();
    }
}
