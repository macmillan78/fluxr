import {
    Store,
    StoreChange,
    disposeAndFilterSubscriptions,
    StoreSubscription,
    configureObservable
} from 'lib/Store';
import {
    Action,
    ActionFunctionBase
} from 'lib/Action';
import {
    Observable,
    Subject,
    Disposable
} from 'rx';

function getActionSource():Subject<Action<any>> {
    return new Subject<Action<any>>();
}

function getStoreSource():Subject<StoreChange<any>> {
    return new Subject<StoreChange<any>>();
}

class TestStore<T> extends Store<T> {
    constructor(sourceIn:Observable<Action<any>>, sourceOut:Subject<StoreChange<any>>, initialState:T, id:string = null) {
        super(sourceIn, sourceOut, initialState, id);
    }

    public get subscriptions() {
        return this._subscriptions;
    }
}

let mockActionCount = 0;
function createMockActionFunction<T>(id?:string):ActionFunctionBase<T> {
    var func:any = function (...payloads:any[]):any {
        return func;
    };
    func.uniqueId = 'action' + ++mockActionCount;
    func.id = id || func.uniqueId;
    func.then = function (exec:any) {
        return func;
    };
    func.catch = function (catchF:any) {
    };

    return <ActionFunctionBase<any>>func;
}

describe("A store", function () {
    it("is created and has given id and initial state", function () {
        let initialState = ["test1", "test2"];
        let id = "an id";
        let store1 = Store.create<string[]>(initialState, "an id");

        expect(store1.id).toBe(id);
        expect(store1.getState()).toEqual(initialState);
    });
    it("registers a subscription", function () {
        let store = new TestStore<string[]>(getActionSource(), getStoreSource(), [], "a store");

        let action = createMockActionFunction("an action");
        let handler = (store) => {
            return store.getState();
        };

        store.on(action, handler);

        expect(store.subscriptions.length).toBe(1);

        let subscription = store.subscriptions[0];

        expect(subscription.action).toBe(action);
        expect(subscription.handler).toBe(handler);
        expect(typeof subscription.disposable.dispose).toBe("function");
    });

    it("adds subscriptions and removes then properly", function () {

        let testStore = new TestStore<string[]>(getActionSource(), getStoreSource(), [], null);

        let testAction1 = createMockActionFunction();

        testStore.on(testAction1, (store, action, stores) => {
            return store.getState();
        });

        testStore.on(testAction1, (store, action, stores) => {
            return store.getState();
        });

        let testAction2 = createMockActionFunction();

        let handler1 = (store, action, stores) => {
            return store.getState();
        };

        let handler2 = (store, action, stores) => {
            return store.getState();
        };

        testStore.on(testAction2, handler1);
        testStore.on(testAction2, handler2);

        expect(testStore.subscriptions.length).toBe(4);

        testStore.off(testAction1);

        expect(testStore.subscriptions.length).toBe(2);

        testStore.off(testAction2, handler1);

        expect(testStore.subscriptions.length).toBe(1);

        testStore.off(testAction2, handler2);

        expect(testStore.subscriptions.length).toBe(0);
    });
    it("adds subscriptions and removes only the ones with same handler", function () {

        let testStore = new TestStore<string[]>(getActionSource(), getStoreSource(), [], null);

        let testAction = createMockActionFunction();

        let handler1 = (store, action, stores) => {
            return store.getState();
        };

        let handler2 = (store, action, stores) => {
            return store.getState();
        };

        testStore.on(testAction, handler1);
        testStore.on(testAction, handler2);

        expect(testStore.subscriptions.length).toBe(2);

        testStore.off(testAction, handler1);

        expect(testStore.subscriptions.length).toBe(1);

        testStore.off(testAction, handler2);

        expect(testStore.subscriptions.length).toBe(0);
    });
});

class TestDisposable implements Disposable {
    private _isDisposed = false;
    public get isDisposed() {
        return this._isDisposed;
    }

    dispose():void {
        this._isDisposed = true;
    }
}

describe("Function disposeAndFilterSubscriptions", function () {
    let getSubscriptions = (num = 3):StoreSubscription<string>[] => {
        let subscriptions:StoreSubscription<string>[] = [];

        for (let i = 0; i < num; i++) {
            subscriptions.push({
                action: createMockActionFunction(),
                handler: (store, action, stores) => {
                    return store.getState();
                },
                disposable: new TestDisposable()
            });
        }

        return subscriptions;
    };

    let action1 = createMockActionFunction();
    let action2 = createMockActionFunction();
    let handler1 = (store, action, stores) => {
        return store.getState();
    };
    let handler2 = (store, action, stores) => {
        return store.getState();
    };


    it("filters and disposes the matching subscription and leaves the others untouched", function () {
        let subscriptions = getSubscriptions();

        let result = disposeAndFilterSubscriptions([subscriptions[0].action], subscriptions[0].handler, subscriptions);

        expect(result.length).toBe(2);
        expect(subscriptions[0].disposable.isDisposed).toBeTruthy();
        expect(subscriptions[1].disposable.isDisposed).toBeFalsy();
        expect(subscriptions[2].disposable.isDisposed).toBeFalsy();
        expect(result).toEqual([subscriptions[1], subscriptions[2]]);
    });
    it("two subscriptions same action function different handler", function () {
        let subscriptions:StoreSubscription<string>[] = getSubscriptions();

        subscriptions = subscriptions.concat({
            action: action1,
            handler: handler1,
            disposable: new TestDisposable()
        }, {
            action: action1,
            handler: handler2,
            disposable: new TestDisposable()
        });


        let result = disposeAndFilterSubscriptions([action1], handler1, subscriptions);

        expect(subscriptions.length).toBe(5);
        expect(result.length).toBe(4);
    });
    it("two subscriptions different action function same handler remove multiple actions", function () {
        let subscriptions:StoreSubscription<string>[] = getSubscriptions();

        subscriptions = subscriptions.concat({
            action: action1,
            handler: handler1,
            disposable: new TestDisposable()
        }, {
            action: action2,
            handler: handler1,
            disposable: new TestDisposable()
        }, {
            action: action2,
            handler: handler2,
            disposable: new TestDisposable()
        });


        let result1 = disposeAndFilterSubscriptions([action1, action2], handler1, subscriptions);
        let result2 = disposeAndFilterSubscriptions([action1, action2], null, subscriptions);
        let result3 = disposeAndFilterSubscriptions([action1, action2], handler2, subscriptions);

        expect(subscriptions.length).toBe(6);
        expect(result1.length).toBe(4);
        expect(result2.length).toBe(3);
        expect(result3.length).toBe(5);
    });
});

function createMockActionObject<T>(action:ActionFunctionBase<T>):Action<T> {
    return new Action<T>(action, null, action.id);
}

function createMockStoreChange<T>(action:Action<any>, store:Store<T>):StoreChange<T> {
    return {
        action,
        store,
        state: null
    };
}

describe("Function configureObservable", function () {
    let actionSource = getActionSource();
    let storeSource = getStoreSource();
    let action1 = createMockActionFunction('action1');
    let action2 = createMockActionFunction('action2');
    let action3 = createMockActionFunction('action3');
    let action4 = createMockActionFunction('action4');
    let store1 = new TestStore(actionSource, storeSource, [], "store1");
    let store2 = new TestStore(actionSource, storeSource, [], "store2");
    let store3 = new TestStore(actionSource, storeSource, [], "store3");
    let store4 = new TestStore(actionSource, storeSource, [], "store4");
    it("", function () {
        let stream = configureObservable(
            actionSource,
            storeSource,
            [action1, action2, action3],
            [store1, store2, store3]
        );

        let subscribe = jasmine.createSpy("subscribe");

        stream.subscribe(subscribe);

        expect(subscribe).not.toHaveBeenCalled();

        actionSource.onNext(createMockActionObject(action1));

        expect(subscribe).not.toHaveBeenCalled();

        storeSource.onNext(createMockStoreChange(createMockActionObject(action1), store1));

        expect(subscribe).not.toHaveBeenCalled();

        storeSource.onNext(createMockStoreChange(createMockActionObject(action2), store2));

        expect(subscribe).not.toHaveBeenCalled();

        storeSource.onNext(createMockStoreChange(createMockActionObject(action3), store3));

        expect(subscribe).toHaveBeenCalled();
    });
    it("", function () {
        let stream1 = configureObservable(
            actionSource,
            storeSource,
            [action1, action2, action3],
            [store1, store2, store3]
        );

        let stream2 = configureObservable(
            actionSource,
            storeSource,
            [action1, action2, action3],
            [store1, store2, store4]
        );

        let subscribe1 = jasmine.createSpy("subscribe1");
        let subscribe2 = jasmine.createSpy("subscribe2");

        stream1.subscribe(subscribe1);
        stream2.subscribe(subscribe2);

        expect(subscribe1).not.toHaveBeenCalled();
        expect(subscribe2).not.toHaveBeenCalled();

        actionSource.onNext(createMockActionObject(action1));

        expect(subscribe1).not.toHaveBeenCalled();
        expect(subscribe2).not.toHaveBeenCalled();

        storeSource.onNext(createMockStoreChange(createMockActionObject(action1), store1));

        expect(subscribe1).not.toHaveBeenCalled();
        expect(subscribe2).not.toHaveBeenCalled();

        storeSource.onNext(createMockStoreChange(createMockActionObject(action2), store4));

        expect(subscribe1).not.toHaveBeenCalled();
        expect(subscribe2).not.toHaveBeenCalled();

        storeSource.onNext(createMockStoreChange(createMockActionObject(action2), store2));

        expect(subscribe1).not.toHaveBeenCalled();
        expect(subscribe2).toHaveBeenCalled();
        expect(subscribe2.calls.count()).toBe(1);

        storeSource.onNext(createMockStoreChange(createMockActionObject(action3), store3));

        expect(subscribe1).toHaveBeenCalled();
        expect(subscribe1.calls.count()).toBe(1);

    });
});