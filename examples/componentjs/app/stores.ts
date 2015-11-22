import { User } from 'app/data';
import { Store, StoreChange } from '../lib/Store';
import { saveUser, loadUser, showLoadingIndicator, hideLoadingIndicator } from 'app/actions';
import { DebugStore } from 'common/flux/DebugStore';
import { Promise } from 'common/Promise';

window['debugStore'] = new DebugStore();

export var rootStore = Store.create<{isBlocked:boolean}>({isBlocked: false}, 'root');

export var userStore = Store.create<User[]>([], 'users');
export var userNumberStore = Store.create<number>(0, 'userCount');
export var userNumberStore2 = Store.create<number>(0, 'userNumberStore2');
export var userNumberStoreboth = Store.create<number>(0, 'userNumberStoreboth');
export var loadingIndicatorStore = Store.create<boolean>(false, 'loadingIndicator');


rootStore.addChildStore(userStore);
rootStore.addChildStore(userNumberStore);
userStore.addChildStore(loadingIndicatorStore);


userStore.on(saveUser, (store, action, stores) => {
    return store.getState().concat(action.payload);
});


userNumberStoreboth.on(saveUser, [userNumberStore, userNumberStore2], (store, action, stores) => {
    return userStore.getState().length;
});


userNumberStore.on(saveUser, [userStore], (store, action, stores) => {
    return userStore.getState().length;
});


userNumberStore2.on(saveUser, [userNumberStore], (store, action, stores) => {
    return userStore.getState().length;
});


loadingIndicatorStore.on(showLoadingIndicator, (store) => {
    return true;
});

loadingIndicatorStore.on(hideLoadingIndicator, (store) => {
    return false;
});

window['debugStore'].subscribe((change:StoreChange<any>, log:StoreChange<any>[]) => {
    console.log('change:: action:', change.action.id, ' (' + JSON.stringify(change.action.payload) + ') ', 'store: ', change.store.id, 'change: ', JSON.stringify(change.state));
});

