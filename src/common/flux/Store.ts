/// <reference path="../../../node_modules/rx/ts/rx.all.d.ts"/>
import { Observable, Subject } from 'rx';
import { ActionFunctionBase, Action } from 'common/flux/Action';

interface StoreHandler<T> {
    (data:T, action:Action<any>, stores:Store<any>[]):T;
}

export class Store<T> {
    constructor(initialData:T, name:string = null) {
        this._data = initialData;
        this._name = name;
        Store.source.onNext(this);
    }

    private static _source:Subject<Store<any>> = new Subject<Store<any>>();;

    private _data:T;
    private _name:string;
    private _counter:number = 0;

    public getState():T {
        return this._data;
    }

    public get name():string {
        return this._name;
    }

    public static get source():Subject<Store<any>> {
        return Store._source;
    }

    public is(store:Store<any>):boolean {
        return this === store;
    }

    public on(action:ActionFunctionBase<any>|ActionFunctionBase<any>[], handler:StoreHandler<T>):void;
    public on(action:ActionFunctionBase<any>|ActionFunctionBase<any>[], waitFor:Store<any>[], handler:StoreHandler<T>):void;

    public on(action:ActionFunctionBase<any>|ActionFunctionBase<any>[], waitFor:any, handler:StoreHandler<T> = null):void {
        var actions:any;
        if (handler == null) {
            if (typeof waitFor == 'function') {
                handler = waitFor;
                waitFor = null;
            } else {
                throw 'No handler given';
            }
        }

        actions = Array.isArray(action) ? actions : [action];

        var stream:Observable<any> = Action.source.filter(
                elem => actions.reduce((result, action) => result || elem.is(action), false)
        );

        if (waitFor && waitFor.length > 0) {
            let firstWaitFor = waitFor.shift();
            let combined:any = stream.and(Store.source.filter(elem => {
                return firstWaitFor.is(elem);
            }));

            waitFor.forEach(elem =>
                combined = combined.and(Store.source.filter(store => elem.is(store)))
            );

            stream = Observable.when(
                combined.thenDo((action:Action<any>, ...stores:Store<any>[]) => {
                    return {
                        action,
                        stores
                    };
                })
            );
        } else {
            stream = Observable.when(
                stream.thenDo((action:Action<any>, ...stores:any[]) => {
                    return {
                        action,
                        stores: []
                    };
                })
            );
        }

        stream.subscribe((callInfo:{action:Action<any>, stores:Store<any>[]}) => {
            this._data = handler.call(null, this._data, callInfo.action, callInfo.stores);

            this._counter++;
            Store.source.onNext(this);
        }, (err) => {
            console.log(err);
        }, () => {
            console.log('completed');
        });
    }

    public static create<T>(initialData:T, name:string = null):Store<T> {
        return new Store<T>(initialData, name);
    }
}
