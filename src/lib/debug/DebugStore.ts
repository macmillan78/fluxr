import {
    Action,
    ActionFunctionBase,
    ActionFunctionSingle,
    ActionFunction
} from 'lib/Action';
import {
    MetaStore
} from 'lib/MetaStore';
import {
    isOneOfActions
} from 'lib/helpers';
import {
    Store,
    StoreChange,
    StoreHandler,
    setState,
    initStores,
    Tags
} from 'lib/Store';

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

export enum DebugMode {
  STATE,
  FULLSTATE,
  DIFF
}

export interface DebugHistoryState {
  states:DebugState[];
  currentState:number;
  mode:DebugMode;
  stateCounter:number;
}

const DebugTags = {
  REPLAY_INACTIVE: 'REPLAY_INACTIVE'
};

export const DebugActions = {
  sweep: Action.create('sweep'),
  commit: Action.create('commit'),
  reset: Action.create('reset'),
  setMode: Action.create<DebugMode>('setMode'),
  toggleStateActive: Action.create<DebugHistoryState>('toggleStateActive'),
  jumpToState: Action.create<DebugHistoryState>('jumpToState')
};


class ControllableMetaStore<T> extends MetaStore<T> {
  private actionSource:Subject<Action<any>>;

  public constructor(actionSource:Subject<Action<any>>,
                     storeSource:Subject<StoreChange<any>>, initialState:T, id:string = null) {
    super(storeSource, initialState, id);

    this.actionSource = actionSource;
  }

  public onAction(boundAction:ActionFunctionBase<any>|ActionFunctionBase<any>[],
                  handler:(store:MetaStore<T>, action?:Action<any>) => any):void {
    let actions = Array.isArray(boundAction) ?
        <ActionFunctionBase<any>[]>boundAction :
        <ActionFunctionBase<any>[]>[boundAction];

    this.actionSource.filter(isOneOfActions(actions)).subscribe(action => {
      let state = handler(this, action);

      if (state !== undefined) {
        this.state = state;

        this.storeSource.onNext({
          action,
          store: this,
          state: this.getState()
        });
      }
    });
  }
}


function calculateState(states, stateIndex, mode) {
  if (mode == DebugMode.DIFF) {
    return states[stateIndex].state;
  }

  let calculatedState = {};
  let i;

  for (i = 0; i <= stateIndex; i++) {
    if (!states[i].inactive) {
      Object.keys(states[i].state).forEach(key => calculatedState[key] = states[i].state[key]);
    }
  }

  return calculatedState;
}

function commit(store:MetaStore<DebugHistoryState>, action:Action<any>):DebugHistoryState {
  const state = store.getState();

  // TODO check
  let commitState    = state.states[state.currentState];
  commitState.action = new Action(initStores, null, action.id);
  commitState.state  = calculateState(state.states, state.currentState, state.mode);
  let states         = [commitState];
  let currentState   = 0;

  return {
    states,
    currentState,
    mode: state.mode,
    stateCounter: state.stateCounter
  };
}

function applyState(state:any) {
  Store.stores.forEach(store => {
    if (state[store.id]) {
      store.setState(state[store.id]);
    }
  });
}

function sweep(store:MetaStore<DebugHistoryState>):DebugHistoryState {
  let state  = store.getState();
  let states = state.states.filter(state => state.inactive == false);

  state = {
    states,
    currentState: states.length - 1,
    mode: state.mode,
    stateCounter: state.stateCounter
  };

  applyState(calculateState(states, state.currentState, state.mode));

  return state;
}

function reset(store:MetaStore<DebugHistoryState>):DebugHistoryState {
  let state        = store.getState();
  let states       = state.states.slice(0, 1);
  let currentState = 0;
  state            = {
    states,
    currentState,
    mode: state.mode,
    stateCounter: state.stateCounter
  };

  applyState(calculateState(states, currentState, state.mode));

  return state;
}

function setMode(store:MetaStore<DebugHistoryState>, action:Action<any>):DebugHistoryState {
  let state = store.getState();

  return {
    states: state.states,
    currentState: state.currentState,
    mode: action.payload,
    stateCounter: state.stateCounter
  };
}

function jumpToState(store:MetaStore<DebugHistoryState>, action:Action<any>):DebugHistoryState {
  let state        = store.getState();
  let position     = state.states.indexOf(action.payload);
  let currentState = state.currentState;

  if (position > -1) {
    currentState = position;

    applyState(calculateState(state.states, currentState, state.mode));
  }

  return {
    states: state.states,
    currentState,
    mode: state.mode,
    stateCounter: state.stateCounter
  }
}

function toggleStateActive(store:MetaStore<DebugHistoryState>, action:Action<any>):DebugHistoryState {
  let state        = store.getState();
  let states       = state.states;
  let currentState = states.length - 1;
  let position     = states.indexOf(action.payload);

  if (position > -1) {
    states[position].inactive = !states[position].inactive;

//    this.replayAll();
  }

  return {
    states,
    currentState,
    mode: state.mode,
    stateCounter: state.stateCounter
  };
}


function replayAll(actionSource:Subject<Action<any>>) {
  return function (store:MetaStore<DebugHistoryState>, action:Action<any>) {
    const state = store.getState();

    applyState(state.states[0].state);

    const replayStates = [...state.states];

    const states = [replayStates.shift()];

    const currentState = states.length - 1;

    const newStoreState = {
      states,
      currentState,
      mode: state.mode,
      stateCounter: state.stateCounter
    };

    // deferred replay of all following actions after the state stack has been reset to first state
    window.setTimeout(() => {
      replayStates.forEach(state => {
        let action;
        if (state.inactive) {
          action = state.action;
          action.addTag(DebugTags.REPLAY_INACTIVE);
          action.addTag(Tags.INTERNAL);
        } else {
          action = state.action;
        }
        actionSource.onNext(action);
      });
    }, 0);

    return newStoreState;
  }
}

let debugStateKeyCounter = 0;
function storeChangeHandler(debugStore:ControllableMetaStore<DebugHistoryState>) {
  return function (change:StoreChange<any>, store:MetaStore<DebugHistoryState>) {
    if (change.store == debugStore || change.action.id == setState.id) {
      return undefined;
    }

    const changeState   = change.state;
    const changeAction  = change.action;
    const changeStoreId = change.store.id;
    const state         = store.getState();

    const mode       = state.mode;
    let currentState = state.currentState;
    let states       = state.states;
    let stateCounter = state.stateCounter;

    if (currentState < states.length - 1) {
      states = states.slice(0, currentState + 1);
    }

    if (states.length > 0
        && states[states.length - 1].action === changeAction) {
      states[states.length - 1].state[change.store.id] = changeState;
    } else {
      let nextState:any;
      let diff:any    = [];
      const lastState = states[states.length - 1] || {state: null};
      if (mode == DebugMode.STATE) {
        nextState = {};
      } else {
        nextState = objectAssign({}, lastState.state || {});
      }
      nextState[changeStoreId] = changeState;

      if (mode == DebugMode.DIFF) {
        diff = prepareDiff(diffDeep(lastState.state || {}, nextState) || []);
      }

      const inactive = changeAction.hasTag(DebugTags.REPLAY_INACTIVE);

      stateCounter = stateCounter + 1;

      states.push({
        key: debugStateKeyCounter++,
        action: change.action,
        state: nextState,
        diff,
        inactive: inactive
      });

      if (inactive) {
        changeAction.removeTag(Tags.INTERNAL);
        changeAction.removeTag(DebugTags.REPLAY_INACTIVE);
      }
    }

    currentState = states.length - 1;

    return {
      states,
      currentState,
      mode,
      stateCounter
    };
  };
}

function prepareDiff(diff) {
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


export function createDebugStore(actionSource:Subject<Action<any>>,
                                 storeSource:Subject<StoreChange<any>>):MetaStore<DebugHistoryState> {

  var debugStore = new ControllableMetaStore<DebugHistoryState>(
      actionSource,
      storeSource, {
        states: [],
        currentState: 0,
        mode: DebugMode.STATE,
        stateCounter: 0
      },
      'debugStore'
  );

  debugStore.on(storeChangeHandler(debugStore));

  debugStore.onAction(DebugActions.sweep, sweep);
  debugStore.onAction(DebugActions.commit, commit);
  debugStore.onAction(DebugActions.reset, reset);
  debugStore.onAction(DebugActions.setMode, setMode);
  debugStore.onAction(DebugActions.jumpToState, jumpToState);
  debugStore.onAction(DebugActions.toggleStateActive, toggleStateActive);

  debugStore.onAction([
    DebugActions.setMode,
    DebugActions.toggleStateActive
  ], replayAll(actionSource));

  return debugStore;
}