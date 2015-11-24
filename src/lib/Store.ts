/// <reference path="../../node_modules/rx/ts/rx.all.d.ts"/>
import { Observable, Subject, ReplaySubject, Disposable } from 'rx';
import {
    StoreStateComposite,
    ComposableStore,
    IStore
} from 'lib/ComposableStore';
import {
    ActionFunctionBase,
    Action,
    ActionFunction,
} from 'lib/Action';
import {
    isOneOfActions,
    isOneOfWith
} from 'lib/helpers';

/**
 * Interface of store handlers, which are registered at the store and use the payload of actions to change the state
 * of stores.
 *
 * Example:
 *
 * let store = Store.create<SomeStateType>();
 *
 * store.on(someAction, (store:IStore<T>, action:Action<any>, stores:IStore<any>[]) => {
 *  let currentState = store.getState();
 *  // ... calculate the new state
 *  return newState;
 * });
 *
 * someAction(payload);
 */
export interface StoreHandler<T> {
  (store:IStore<T>, action:Action<any>, stores:IStore<any>[]):T;
}

/**
 * Store Change, which will be propagated through the Store.source observable.
 */
export interface StoreChange<T> {
  action:Action<any>,
  store:IStore<T>,
  state:T
}

/**
 * A disposable subscription to a store.
 */
export interface StoreSubscription<T> {
  action:ActionFunctionBase<any>;
  handler:StoreHandler<T>;
  disposable:Disposable;
}

//--- core actions
/**
 * Predefined init action. Should be used to trigger initialization of the stores.
 *
 * @type {ActionFunction}
 */
export const initStores:ActionFunction = Action.create('@@INIT_STORES@@');
/**
 *
 *
 * @type {ActionFunction}
 */
export const setState:ActionFunction   = Action.create('@@SET_STATE@@');

const actionStoreMap:any = {};

/**
 * Filters a set of subscriptions
 *
 * @param actions
 * @param handler
 * @param subscriptions
 * @returns {any}
 */
export function disposeAndFilterSubscriptions<T>(actions:ActionFunctionBase<any>[],
                                                 handler:StoreHandler<T>,
                                                 subscriptions:StoreSubscription<T>[]):StoreSubscription<T>[] {
  let isSubscriptionOneOfActions = isOneOfWith<ActionFunctionBase<any>, StoreSubscription<T>>
  (actions, (one, two) => one.action == two);

  return subscriptions.map(subscription => {
    if (isSubscriptionOneOfActions(subscription)
        && (handler == null || subscription.handler == handler)) {
      subscription.disposable.dispose();
    }

    return subscription;
  }).filter(subscription => !(isSubscriptionOneOfActions(subscription)
  && (handler == null || subscription.handler == handler)));
}

/**
 * Configures an observable to filter for actions and wait for store changes.
 *
 * @param streamIn
 * @param streamOut
 * @param actions
 * @param waitFor
 * @returns {Observable<any>}
 */
export function configureObservable(streamIn:Observable<any>,
                                    streamOut:Subject<any>,
                                    actions:ActionFunctionBase<any>[],
                                    waitFor:any) {
  if (actions.length == 1 && actions[0] == null) {
    return streamIn;
  }

  streamIn = streamIn.filter(isOneOfActions(actions));

  if (Array.isArray(waitFor) && waitFor.length > 0) {
    let combined:any = streamIn;

    waitFor.forEach(elem =>
        combined = combined.and(streamOut.filter(
            change => elem.is(change.store)
        )));

    streamIn = Observable.when(
        combined.thenDo((action:Action<any>, ...stores:Store<any>[]) => {
          return {
            action,
            stores
          };
        })
    );
  } else {
    streamIn = Observable.when(
        streamIn.thenDo((action:Action<any>, ...stores:any[]) => {
          return {
            action,
            stores: []
          };
        })
    );
  }

  return streamIn;
}

export const Tags = {
  INTERNAL: 'INTERNAL'
};

/**
 * Store class
 */
export class Store<T> extends ComposableStore<T> {
  protected static _source;
  protected static _storeCount:number   = 0;
  protected static _stores:Store<any>[] = [];

  protected state:T;
  protected _subscriptions:StoreSubscription<T>[]    = [];
  protected _sourceOut:Subject<StoreChange<any>>;
  protected _sourceIn:Observable<Action<any>>;

  public static debug = false;
  public debug        = false;

  /**
   * Constructor.
   *
   * @param sourceOut    Source to send the changes to.
   * @param sourceIn     Source to send the actions in.
   * @param initialState Initial state.
   * @param id           Id of the store. If null, the id is generated.
   */
  constructor(sourceIn:Observable<Action<any>>, sourceOut:Subject<StoreChange<any>>, initialState:T, id:string = null) {
    super(initialState, id);

    this._sourceIn  = sourceIn;
    this._sourceOut = sourceOut;

    this.on([initStores], () => initialState);
  }

  /**
   * Get the stores state.
   *
   * @param state
   */
  public setState(state:T) {
    this.state = state;
    this.onNext(new Action(setState, null, setState.id));
  }

  /**
   * Get RXJS source.
   *
   * @returns {Subject<StoreChange<any>>}
   */
  public static get source():Subject<StoreChange<any>> {
    if (!Store._source) {
      Store._source = new Subject<StoreChange<any>>();
    }
    return Store._source;
  }

  /**
   * Get RXJS source.
   *
   * @returns {Subject<StoreChange<any>>}
   */
  public static set source(subject:Subject<StoreChange<any>>) {
    Store._source = subject;
  }

  /**
   * List of all stores created.
   *
   * @returns {Store<any>[]}
   */
  public static get stores():Store<any>[] {
    return Store._stores;
  }

  public on(handler:StoreHandler<T>):void;
  public on(action:ActionFunctionBase<any>|ActionFunctionBase<any>[], handler:StoreHandler<T>):void;
  public on(action:ActionFunctionBase<any>|ActionFunctionBase<any>[], waitFor:Store<any>[], handler:StoreHandler<T>):void;

  /**
   * Add action store handler.
   *
   * Create action function with Action#create().
   *
   * @param action  Action function reference or array of action function references.
   * @param waitFor Array of references of stores to wait for to be updated.
   * @param handler Handler to register.
   */
  public on(action:any, waitFor:any = null, handler:StoreHandler<T> = null):void {
    if (handler == null) {
      if (typeof waitFor == 'function') {
        handler = waitFor;
        waitFor = null;
      } else if (typeof action == 'function') {
        handler = action;
        waitFor = action = null;
      } else {
        throw 'No handler given';
      }
    }

    var actions:ActionFunctionBase<any>[] = Array.isArray(action) ?
        <ActionFunctionBase<any>[]>action : [action];

    // TODO Necessarry?
    // If needed. than
    actions.forEach((action) => {
      if (!actionStoreMap.hasOwnProperty(action.uniqueId)) {
        actionStoreMap[action.uniqueId] = [];
      }
      actionStoreMap[action.uniqueId].indexOf(this) == -1 && actionStoreMap[action.uniqueId].push(this);
    });

    actions.forEach(action => this._subscriptions.push({
      action,
      handler,
      disposable: this.subscribeStream(
          configureObservable(this._sourceIn, this._sourceOut, [action], waitFor),
          handler
      )
    }));
  }

  /**
   * Subscribe the store handler to the observable stream to change the store change on next.
   *
   * @param stream   Stream to subscribe to.
   * @param handler  Handler to call on next.
   * @returns {Disposable} Stream subscription.
   */
  protected subscribeStream(stream, handler) {
    return stream.subscribe((callInfo:{action:Action<any>, stores:Store<any>[]}) => {
      if (callInfo.action.hasTag(Tags.INTERNAL)) {
        this.onNext(callInfo.action);
      } else {
        this.state = handler(this, callInfo.action, callInfo.stores);

        if (this.debug || Store.debug) {
          console.log(`change occured on store ${this.id}:`, this.state);
        }

        this.onNext(callInfo.action);
      }
    }, (err) => {
      console.log(err);
    }, () => {
      console.log('completed');
    });
  }

  /**
   * Unsubscribe and dispose one or more actions.
   *
   * If handler given, only the subscriptions of the given actions using the handler are unsubscribed and disposed.
   * Otherwise all subscriptions utilitizing the given actions are unsubscribed.
   *
   * @param action  Action or array of actions to unsubscribe.
   * @param handler Optional handler to unsubscribe.
   */
  public off(action:ActionFunctionBase<any>|ActionFunctionBase<any>[], handler?:StoreHandler<T>):void {
    var actions:any;
    actions = Array.isArray(action) ? action : [action];

    this._subscriptions = disposeAndFilterSubscriptions(actions, handler, this._subscriptions);
  }

  /**
   * Create a new store.
   *
   * @param initialState Initial State of the store.
   * @param id         Name for debugging purposes.
   * @returns {Store<T>}
   */
  public static create<T>(initialState:T, id?:string):Store<T> {
    let store = new Store<T>(Action.source, Store.source, initialState, id);

    this.stores.push(store);

    return store;
  }

  /**
   * Prepare a store change object.
   *
   * @param action
   * @returns {{action: Action<T>, store: Store, state: T}}
   */
  protected prepareStoreChange(action:Action<T>):StoreChange<T> {
    return {
      action,
      store: this,
      state: this.state
    };
  }

  /**
   * Send the action as store change in the store stream.
   *
   * @param action Action to send.
   */
  protected onNext(action:Action<T>):void {
    this._sourceOut.onNext(this.prepareStoreChange(action));
  }
}
