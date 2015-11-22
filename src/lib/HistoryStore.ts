import {
    Action,
    Store,
    StoreChange,
    setState
} from 'fluxr';

import {
    Observable,
    Subject
} from 'rx';

import objectAssign = require('object-assign');

import deepDiff = require('deep-diff');
let diffDeep:any = deepDiff.diff;

export interface DebugState {
  key:number;
  action:Action<any>;
  state:any;
  diff:any;
  inactive:boolean;
}

export enum DebugModes {
  STATE,
  FULLSTATE,
  DIFF
}

const added   = {
  color: 'green'
};
const removed = {
  color: 'red',
  textDecoration: 'line-through'
};

// implement connected.
export class DebugStore {
  private _states:DebugState[]                         = [];
  private _handlers:((debugStore:DebugStore) => any)[] = [];
  private _currentState                                = 0;
  private _throttle                                    = 0;
  private _mode                                        = DebugModes.STATE;
  private timer                                        = null;
  private stateCounter                                 = 0;
  protected actionSource:Subject<Action<any>>;
  protected storeSource:Subject<StoreChange<any>>;

  public get states():any[] {
    return this._states;
  }

  public get currentState() {
    return this._currentState;
  }

  constructor(actionSource:Subject<Action<any>>, storeSource:Subject<StoreChange<any>>, throttle:number = 0, mode = DebugModes.STATE) {
    this.actionSource = actionSource;
    this.storeSource  = storeSource;
    this._throttle    = throttle;
    this._mode        = DebugModes.STATE;

    this.storeSource
        .filter((change) => change.action.id != setState.id)
        .subscribe((change:StoreChange<any>) => this.storeChangeHandler(change));
  }

  private storeChangeHandler(change:StoreChange<any>) {
    if (this._currentState < this._states.length - 1) {
      this._states = this._states.slice(0, this._currentState + 1);
    }

    if (this._states.length > 0
        && this._states[this._states.length - 1].action === change.action) {
      this._states[this._states.length - 1].state[change.store.id] = change.state;
    } else {
      let state:any;
      let diff:any  = [];
      let lastState = this._states[this._states.length - 1] || {state: null};
      if (this._mode == DebugModes.STATE) {
        state = {};
      } else {
        state = objectAssign({}, lastState.state || {});
      }
      state[change.store.id] = change.state;

      if (this._mode == DebugModes.DIFF) {
        diff = this.prepareDiff(diffDeep(lastState.state || {}, state) || []);
      }

      this._states.push({
        key: ++this.stateCounter,
        action: change.action,
        state,
        diff,
        inactive: change.action.isNoop
      });

      change.action.isNoop = false;
    }

    this._currentState = this._states.length - 1;

    if (this.timer != null) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.timer = window.setTimeout(() => {
      this.fireHandlers();
      this.timer = null;
    }, this._throttle);
  }

  private prepareDiff(diff) {
    let newDiff = [];

    diff.forEach(change => {
      let newChange = {
        path: change.path.join('.') + (change.kind == 'A' ? '.' + change.index : '')
      };
      switch (change.kind) {
        case 'E':
          newChange['deleted'] = change.lhs;
          newChange['added']   = change.rhs;
          break;
        case 'D':
          newChange['deleted'] = change.lhs;
          break;
        case 'N':
          newChange['added'] = change.rhs;
          break;
        case 'A':
          switch (change.item.kind) {
            case 'D':
              newChange['deleted'] = change.item.lhs;
              break;
            case 'N':
              newChange['added'] = change.item.rhs;
              break;
            case 'E':
              newChange['deleted'] = change.item.lhs;
              newChange['added']   = change.item.rhs;
              break;
          }
          break;
      }

      newDiff.push(newChange);
    });

    return newDiff;
  }

  private fireHandlers() {
    this._handlers.forEach((handler) => {
      handler(this);
    });
  }

  public jumpToState(state:DebugState) {
    let currentState = this.states.indexOf(state);

    if (currentState > -1) {
      this._currentState = currentState;

      this.applyState(this._currentState);
    }

    this.fireHandlers();
  }

  public toggleStateActive(state:DebugState) {
    this._currentState = this.states.length - 1;
    let currentState   = this.states.indexOf(state);

    if (currentState > -1) {
      this.states[currentState].inactive = !this.states[currentState].inactive;

      this.replayAll();
    }
  }

  private replayAll() {
    this.applyState(0);

    let states   = [...this.states];
    this._states = [states.shift()];

    states.forEach(state => {
      let action;
      if (state.inactive) {
        action        = state.action;
        action.isNoop = true;
      } else {
        action = state.action;
      }
      this.actionSource.onNext(action);
    });

    this._currentState = this.states.length - 1;
  }

  private calculateState(stateIndex) {
    if (this._mode == DebugModes.DIFF) {
      return this._states[stateIndex].state;
    }

    let calculatedState = {};
    let i;

    for (i = 0; i <= stateIndex; i++) {
      if (!this._states[i].inactive) {
        Object.keys(this._states[i].state).forEach(key => calculatedState[key] = this._states[i].state[key]);
      }
    }

    return calculatedState;
  }

  private applyState(stateIndex) {
    let calculatedState = this.calculateState(stateIndex);

    Store.stores.forEach(store => {
      if (calculatedState[store.id]) {
        store.setState(calculatedState[store.id]);
      }
    });
  }

  public commit() {
    let state          = this._states[this._currentState];
    state.state        = this.calculateState(this._currentState);
    this._states       = [state];
    this._currentState = 0;

    this.fireHandlers();
  }

  public sweep() {
    this._states       = this._states.filter(state => state.inactive == false);
    this._currentState = this._states.length - 1;
    this.applyState(this._currentState);
    this.fireHandlers();
  }

  public reset() {
    this._states       = this._states.slice(0, 1);
    this._currentState = 0;
    this.applyState(this._currentState);
    this.fireHandlers();
  }

  public setMode(mode:DebugModes) {
    this._mode = mode;

    this.replayAll();
  }

  public subscribe(handler:(debugStore:DebugStore) => any):void {
    this._handlers.push(handler);
  }

}