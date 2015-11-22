/// <reference path="../../node_modules/rx/ts/rx.all.d.ts"/>
import { Subject, AsyncSubject, Observable } from 'rx';

export interface Executor {
    (action:Action<any>, resolve:(payload:any)=>any, reject:(reason:any)=>any):any;
}

export interface CatchFunction {
    (reason:any, action:Action<any>):any;
}

export interface ActionFunctionBase<T> {
    id:string;
    uniqueId:string;
    then(executor:Executor):ActionFunctionBase<T>;
    catch(catchF:CatchFunction):void;
    is(action:ActionFunctionBase<any>):boolean;
}

export interface ActionFunction extends ActionFunctionBase<ActionFunction> {
    ():ActionFunctionBase<ActionFunction>;
}

export interface ActionFunctionSingle<T> extends ActionFunctionBase<T> {
    (payload1:T):ActionFunctionBase<T>;
}

export interface ActionFunction1<T,V1> extends ActionFunctionBase<T> {
    (payload1:V1):ActionFunctionBase<T>;
}

export interface ActionFunction2<T,V1,V2> extends ActionFunctionBase<T> {
    (payload1:V1, payload2:V2):ActionFunctionBase<T>;
}

export interface ActionFunction3<T,V1,V2,V3> extends ActionFunctionBase<T> {
    (payload1:V1, payload2:V2, payload3:V3):ActionFunctionBase<T>;
}

export interface ActionFunction4<T,V1,V2,V3,V4> extends ActionFunctionBase<T> {
    (payload1:V1, payload2:V2, payload3:V3, payload4:V4):ActionFunctionBase<T>;
}

export interface ActionFunction5<T,V1,V2,V3,V4,V5> extends ActionFunctionBase<T> {
    (payload1:V1, payload2:V2, payload3:V3, payload4:V4, payload5:V5):ActionFunctionBase<T>;
}

export class Action<T> {
    private static _source = new Subject<Action<any>>();
    private static _actionCounter:number = 0;

    private _payload:T;
    private _action:ActionFunctionBase<any>;
    private _id:string;

    private _tags:string[] = [];

    constructor(action:ActionFunctionBase<any>, payload:T, id:string) {
        this._action = action;
        this._payload = payload;
        this._id = id;
    }

    public static get source():Observable<Action<any>> {
        return Action._source;
    }

    public addTag(tag:string):void {
        if (this._tags.indexOf(tag) == -1) {
            this._tags.push(tag);
        }
    }

    public removeTag(tag:string):void {
        this._tags = this._tags.filter(current => current != tag);
    }

    public hasTag(tag:string):boolean {
        return this._tags.indexOf(tag) > -1;
    }

    public static set subject(subject:Subject<Action<any>>) {
        Action._source = subject;
    }

    /*protected*/public static get subject():Subject<Action<any>> {
        return Action._source;
    }

    public get action():ActionFunctionBase<any> {
        return this._action;
    }

    public get payload():T {
        return this._payload;
    }

    public get id():string {
        return this._id;
    }

    public is(action:ActionFunctionBase<any>):boolean {
        return this._action == action;
    }

    public static create(id?:string):ActionFunction;
    public static create<ObservableType>(id?:string):ActionFunctionSingle<ObservableType>;
    public static create<ObservableType,T>(mapper:(T) => ObservableType, id?:string):ActionFunction1<ObservableType,T>;
    public static create<ObservableType,T1, T2>(mapper:(T1, T2) => ObservableType, id?:string):ActionFunction2<ObservableType,T1, T2>;
    public static create<ObservableType,T1, T2, T3>(mapper:(T1, T2, T3) => ObservableType, id?:string):ActionFunction3<ObservableType,T1, T2, T3>;
    public static create<ObservableType,T1, T2, T3, T4>(mapper:(T1, T2, T3, T4) => ObservableType, id?:string):ActionFunction4<ObservableType,T1, T2, T3, T4>;
    public static create<ObservableType,T1, T2, T3, T4, T5>(mapper:(T1, T2, T3, T4, T5) => ObservableType, id?:string):ActionFunction5<ObservableType,T1, T2, T3, T4, T5>;

    public static create(mapper:any = null, id:string = null):any {
        if (typeof mapper == 'string') {
            id = mapper;
            mapper = null;
        }

        return (() => {
            let executors:Executor[] = [];
            let catchFunc:CatchFunction = (reason:any, action:Action<any>) => {
            };

            let entry = Action.buildExecutorSubject(() => catchFunc, () => executors);

            var func:any = function (...payloads:any[]):any {
                const action = Action.createActionObject(payloads, func, id, mapper);

                if (executors.length > 0) {
                    entry.onNext(action);
                } else {
                    Action._source.onNext(action);
                }

                return func;
            };

            func.uniqueId = 'action' + ++this._actionCounter;
            func.id = id || func.uniqueId;

            func.then = function (exec:Executor) {
                executors.push(exec);

                return func;
            };

            func.catch = function (catchF:CatchFunction) {
                catchFunc = catchF;
            };

            return <ActionFunctionBase<any>>func;
        })();
    }

    private static createActionObject(payloads:any[], actionCallable:ActionFunctionBase<any>, id, mapper):Action<any> {
        var action:Action<any>;

        if (payloads.length == 0) {
            action = new Action(actionCallable, null, id);
        } else if (payloads.length == 1) {
            if (mapper == null) {
                action = new Action(actionCallable, payloads[0], id);
            } else {
                action = new Action(actionCallable, mapper.call(null, payloads[0]), id);
            }
        } else {
            if (mapper == null) {
                throw new Error('If more than one payload given, a mapper function is needed');
            } else {
                action = new Action(actionCallable, mapper.apply(null, payloads), id);
            }
        }

        return action;
    }

    private static buildExecutorSubject(catchFunc:() => CatchFunction, executor:() => Executor[]):Subject<Action<any>> {
        const entry = new Subject<Action<any>>();

        const concatenated = entry.map((next:Action<any>) => {
            return Observable.defer(() => {
                let subject = new AsyncSubject<Action<any>>();
                let executors = executor();
                let counter = 0;

                if (executors.length == 0) {
                    subject.onCompleted();
                    return subject;
                }

                var resolve = (action:Action<any>) => {
                    if (++counter < executors.length) {
                        executors[counter](action, resolve, reject);
                    } else {
                        subject.onNext(action);
                        subject.onCompleted();
                    }
                };

                var reject = (reason:any) => {
                    catchFunc()(reason, next);
                    subject.onCompleted();
                };

                executors[counter](next, resolve, reject);

                return subject;
            });
        }).concatAll();

        concatenated.subscribe((action:Action<any>) => {
            Action._source.onNext(action);
        });

        return entry;
    }
}
