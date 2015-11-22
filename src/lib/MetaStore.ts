import {
    IStore,
    StoreStateComposite,
    ComposableStore
} from 'lib/ComposableStore';
import {
    Store,
    StoreChange,
} from 'lib/Store';
import {
    isChangeByOneOfStores,
} from 'lib/helpers';
import {
    Subject,
    Disposable
} from 'rx';

export interface MetaStoreHandler<T> {
  (change:StoreChange<any>, store:MetaStore<T>):T;
}

export interface MetaStoreSubscription<T> {
  store:MetaStore<any>;
  handler:MetaStoreHandler<T>;
  disposable:Disposable;
}

export class MetaStore<T> extends ComposableStore<T> {
  protected subscriptions:MetaStoreSubscription<T>[] = [];
  protected storeSource:Subject<StoreChange<any>>;

  public constructor(source:Subject<StoreChange<any>>, initialState:T, id:string = null) {
    super(initialState, id);
    this.storeSource = source;
  }

  public on(handler:MetaStoreHandler<T>):void;
  public on(store:Store<any>|Store<any>[], handler:MetaStoreHandler<T>):void;

  public on(store:any, handler:any = null):void {
    if (handler == null) {
      if (typeof store == 'function') {
        handler = store;
        store   = null;
      } else {
        throw new Error("MetaStore#on() needs a handler.");
      }
    }

    store = Array.isArray(store) ? store : [store];

    store.forEach(store => this.subscriptions.push({
      store,
      handler,
      disposable: store == null ? this.storeSource.filter(change => !change.store.is(this))
          .subscribe(this.subscriber(handler).bind(this)) :
          this.storeSource.filter(change => !change.store.is(this))
              // TODO Change to waitFor behavior
              .filter(isChangeByOneOfStores([store])).subscribe(this.subscriber(handler).bind(this))
    }));
  }

  public subscriber(handler:MetaStoreHandler<T>) {
    return (storeChange:StoreChange<any>) => {
      let state = handler(storeChange, this);

      if (state !== undefined) {
        this.state = state;

        this.storeSource.onNext({
          action: storeChange.action,
          store: this,
          state: this.state
        });
      }
    };
  }
}
