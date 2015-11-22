import {
    StoreChange,
} from 'lib/Store';
import {
    Subject
} from 'rx';

export interface StoreStateComposite<T> {
  state:T;
}

export interface IStore<T> {
  addChildStore(store:IStore<any>):IStore<T>;
  addChildStore(store:IStore<any>, id:string):IStore<T>;
  getState():T;
  setState(state:T);
  getDeepState():StoreStateComposite<T>;
  getStateWithChildren():StoreStateComposite<T>;
  is(store:IStore<any>):boolean;
  id:string;
}

export class ComposableStore<T> implements IStore<T> {
  protected static _storeCount:number                = 0;
  protected state:T;
  protected _childStores:{[key:string]: IStore<any>} = {};

  private _id:string;

  get id():string {
    return this._id;
  }

  public constructor(initialState:T, id:string = null) {
    this._id         = id == null ? ComposableStore.getNextStoreId() : id;
    this.state       = initialState;
  }

  protected static getNextStoreId() {
    return 'store' + ++ComposableStore._storeCount;
  }

  public addChildStore(store:IStore<any>):IStore<T>;
  public addChildStore(store:IStore<any>, id:string):IStore<T>;

  /**
   * Add child stores to build a tree of stores.
   *
   * This enables using
   *
   * @param store
   * @param id
   * @returns {Store}
   */
  public addChildStore(store:IStore<any>, id:string = null):IStore<T> {
    id = id || store.id;

    this._childStores[id] = store;

    return this;
  }

  public getState():T {
    return this.state;
  }

  public setState(state:T) {
    this.state = state;
  }

  /**
   * Get the state of the complete subtree of child stores.
   *
   * @returns {StoreStateComposite<T>}
   */
  public getDeepState():StoreStateComposite<T> {
    return this.collectChildStates((store) => {
      return store.getDeepState();
    });
  }

  /**
   *
   *
   * @param reducer
   * @returns {any}
   */
  protected collectChildStates(reducer:(store:IStore<any>)=>any):StoreStateComposite<T> {
    let deepState:any = {
      state: this.getState()
    };

    for (let i in this._childStores) {
      if (this._childStores.hasOwnProperty(i)) {
        deepState[i] = reducer(this._childStores[i]);
      }
    }

    return deepState;
  }

  /**
   * Get the state of this store and the direct children only.
   *
   * @returns {StoreStateComposite<T>}
   */
  public getStateWithChildren():StoreStateComposite<T> {
    return this.collectChildStates((store) => {
      return store.getState();
    });
  }

  /**
   * Identity.
   *
   * @param store Store to compare with.
   * @returns {boolean}
   */
  public is(store:IStore<any>):boolean {
    return this === store;
  }
}