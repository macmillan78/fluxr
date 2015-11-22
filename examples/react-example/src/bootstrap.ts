import {
    Action,
    MetaStore,
    Store,
    StoreChange,
    isChangeByOneOfStores,
    toPayload,
    createDebugStore
} from 'fluxr';

import {
    Observable,
    Subject,
    ReplaySubject
} from 'rx';

/// --- bootstrap
const actionSubject = new Subject<Action<any>>();
const storeSubject  = new Subject<StoreChange<any>>();
Action.subject      = actionSubject;
Store.source        = storeSubject;

//export const debugStore = new DebugStore(actionSubject, storeSubject);
export const debugStore = createDebugStore(actionSubject, storeSubject);
window['debugStore'] = debugStore;



/// --- Actions
export interface Todo {
  id:number;
  text:string;
  completed:boolean;
}

export const addTodo            = Action.create<Todo>("addTodo");
export const toggleCompleteTodo = Action.create<number>("toggleCompleteTodo");
export const deleteTodo         = Action.create<number>("deleteTodo");

/// --- Stores
export const todoStore           = Store.create<Todo[]>([], "todoStore");
export const completedCountStore = Store.create<number>(0, "completedCountStore");

let todoCounter = 0;
todoStore.on(addTodo, (store:Store<Todo[]>, action:Action<any>, stores:Store<any>[]) => {
  let todo = action.payload;
  if (todo.id == -1) {
    todo.id = ++todoCounter;
  }

  return store.getState().concat(todo);
});

todoStore.on(toggleCompleteTodo, (store:Store<Todo[]>, action:Action<any>, stores:Store<any>[]) =>
    store.getState().map(todo => {
      return {
        id: todo.id,
        text: todo.text,
        completed: action.payload == todo.id ? !todo.completed : todo.completed
      };
    })
);

todoStore.on(deleteTodo, (store:Store<Todo[]>, action:Action<any>, stores:Store<any>[]) =>
    store.getState().filter(todo => action.payload != todo.id)
);

completedCountStore.on(
    [toggleCompleteTodo, deleteTodo],
    [todoStore],
    (store:Store<number>, action:Action<any>, stores:Store<any>[]) =>
        todoStore.getState().filter(todo => todo.completed == true).length
);


/// ---- second!!!
export const addTodo2            = Action.create<Todo>("addTodo2");
export const toggleCompleteTodo2 = Action.create<number>("toggleCompleteTodo2");
export const deleteTodo2         = Action.create<number>("deleteTodo2");

export const todoStore2           = Store.create<Todo[]>([], "todoStore2");
export const completedCountStore2 = Store.create<number>(0, "completedCountStore2");

let todoCounter2 = 0;
todoStore2.on(addTodo2, (store:Store<Todo[]>, action:Action<any>, stores:Store<any>[]) => {
  let todo = action.payload;
  if (todo.id == -1) {
    todo.id = ++todoCounter2;
  }

  return store.getState().concat(todo);
});

todoStore2.on(toggleCompleteTodo2, (store:Store<Todo[]>, action:Action<any>, stores:Store<any>[]) =>
    store.getState().map(todo => {
      return {
        id: todo.id,
        text: todo.text,
        completed: action.payload == todo.id ? !todo.completed : todo.completed
      };
    })
);

todoStore2.on(deleteTodo2, (store:Store<Todo[]>, action:Action<any>, stores:Store<any>[]) =>
    store.getState().filter(todo => action.payload != todo.id)
);

completedCountStore2.on(
    [toggleCompleteTodo2, deleteTodo2],
    [todoStore2],
    (store:Store<number>, action:Action<any>, stores:Store<any>[]) =>
        todoStore2.getState().filter(todo => todo.completed == true).length
);