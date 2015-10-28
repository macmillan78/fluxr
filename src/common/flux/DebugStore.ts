import { Action } from 'common/flux/Action';
import { Store } from 'common/flux/Store';
import { Observable } from 'rx';

declare type LogEntry = {
    action:Action<any>,
    dataChanges:{store:Store<any>,data:any}[]
};

var initAction = Action.create('initAction');

export class DebugStore {
    private _log:LogEntry[] = [];

    public getLog():LogEntry[] {
        return this._log;
    }

    private _counter = 0;

    constructor() {
        var storeSubscriber:any = function (action) {
            return (stores) => {
                console.log(stores);

                var dataChanges:{store:Store<any>,data:any}[] = [];

                //stores.forEach((store) => {
                //    dataChanges.push({
                //        store,
                //        data: store.getState()
                //    });
                //});
                //
                this._log.push({
                    action,
                    dataChanges
                });
            };
        }.bind(this);


        Action.source.subscribe((action) => {
            this._counter++;

            Store.source.map(elem => {
                console.log('map2', elem);
                return elem;
            }).takeUntil(Action.source).subscribe(storeSubscriber(initAction), (err) => {
            }, () => {
                console.log("-------- completed --------", this._counter);
            });
        });
    }

    public subscribe(handler:(appStateChange:{
        action:Action<any>,
        stores:Store<any>[]
    }) => any):void {
        //
    }
}

//Store.source.subscribe((store) => {
//    console.log('a store:::', store);
//});