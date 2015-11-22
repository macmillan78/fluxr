import {
    ActionFunctionBase,
    Action
} from 'lib/Action';
import {
    StoreChange
} from 'lib/Store';
import {
    IStore
} from 'lib/ComposableStore';

export interface BooleanBiConsumer<T1, T2> {
    (one:T1, two:T2):boolean;
}
export interface BooleanConsumer<T> {
    (one:T):boolean;
}

/**
 * Creates a function, which checks values or references of type 2 to be equal to one of a list of type 1 using a
 * compare function, which makes the two comparable.
 *
 * @param checkFor  List of values or references.
 * @param cmp       Compare function, which accepts both types.
 * @returns {BooleanConsumer<T2>} The boolean function.
 */
export function isOneOfWith<T1, T2>(checkFor:T1[], cmp:BooleanBiConsumer<T2, T1>):BooleanConsumer<T2> {
    return elem => checkFor.reduce((result, oneCheckFor) => result || cmp(elem, oneCheckFor), false);
}
/**
 * Creates a function, which checks action objects to contain an action function of a list of action functions.
 *
 * @param actions Action function to compare the action objects nested function with.
 * @returns {BooleanConsumer<Action<any>>}
 */
export function isOneOfActions(actions:ActionFunctionBase<any>[]):BooleanConsumer<Action<any>> {
    return isOneOfWith<ActionFunctionBase<any>, Action<any>>(actions, (one, two) => one.is(two));
}

// for changes
/**
 * Creates a function, which checks a store change against a list of stores.
 *
 * @param stores
 * @returns {BooleanConsumer<StoreChange<T>>}
 */
export function isChangeByOneOfStores<T>(stores:IStore<T>[]):BooleanConsumer<StoreChange<T>> {
    return isOneOfWith<IStore<T>, StoreChange<T>>(stores, (one, two) => one.store.is(two));
}

export function isChangeByOneOfActions<T>(actions:ActionFunctionBase<any>[]):BooleanConsumer<StoreChange<T>> {
    return isOneOfWith<ActionFunctionBase<any>, StoreChange<T>>(actions, (one, two) => one.action.is(two));
}

export function isChangeByStore<T>(store:IStore<T>):BooleanConsumer<StoreChange<T>> {
    return isChangeByOneOfStores([store]);
}

export function isChangeByAction<T>(action:ActionFunctionBase<any>):BooleanConsumer<StoreChange<T>> {
    return isChangeByOneOfActions([action]);
}

export function changeStateHoldsPredicate<T>(predicate:(data:T) => boolean):BooleanConsumer<StoreChange<T>> {
    return change => predicate(change.state);
}

export function toPayload<T>(change:StoreChange<T>):T {
    return change.state;
}