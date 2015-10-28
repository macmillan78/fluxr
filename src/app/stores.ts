import { Store } from 'common/flux/Store';
import { saveUser, loadUser } from 'app/actions';
import { DebugStore } from 'common/flux/DebugStore';

window['debugStore'] = new DebugStore();

export var userStore = Store.create<{username:string, password:string}[]>([], 'userStore');

userStore.on(saveUser, (data, action, stores) => {
    console.log('user');
    return data.concat(action.payload);
});

export var userNumberStore = Store.create<number>(0, 'userNumberStore');

userNumberStore.on(saveUser, [userStore], (data, action, stores) => {
    console.log('userNumber');
    return userStore.getState().length;
});