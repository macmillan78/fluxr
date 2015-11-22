import {
    User,
    Task
} from 'app/data';
import { Action } from '../lib/Action';
import { isOneOfActions } from '../lib/helpers';

export var reloadAll = Action.create('reloadAll');

export var saveTask = Action.create<Task>('saveTask');

//export var saveTask = Action.create<Task, string, boolean, Date, boolean>((name:string, completed:boolean, time:Date, archived:boolean) => {
//    return new Task(name, completed, time, archived);
//},'saveTask');

//saveTask(new Task('name', false, new Date('now'), false));
//

//saveTask('name', false, new Date('now'), false);

export var loadUser = Action.create<string>('loadUser');

//export var savingUser = Action.create('savingUser');
//export var savedUser = Action.create('savedUser');
//
export var saveUser = Action
    .create<User, string, string>(
    (username:string, password:string) => {
        return {
            username,
            password
        };
    }, 'saveUser'
);

export var showLoadingIndicator = Action.create<string>('showLoadingIndicator');
export var hideLoadingIndicator = Action.create<string>('hideLoadingIndicator');

export var savingUser = Action.create('savingUser');
export var savedUser = Action.create('savedUser');
export var savingUserAborted = Action.create('savingUserAborted');
export var checkingUserDuplicate = Action.create('checkingUserDuplicate');
export var checkedUserDuplicate = Action.create('checkedUserDuplicate');

Action.source.filter(isOneOfActions([savingUser, checkingUserDuplicate])).subscribe((action) => {
    showLoadingIndicator(action.action.id);
});
Action.source.filter(isOneOfActions([savedUser, checkedUserDuplicate, savingUserAborted])).subscribe((action) => {
    hideLoadingIndicator(action.action.id);
});

function checkForUserDuplicateAsync(action, resolve, reject) {
    checkingUserDuplicate();
    window.setTimeout(() => {
        resolve(action);
        checkedUserDuplicate();
    }, 1000);
}

function saveUserAsync(action, resolve, reject) {
    savingUser();
    window.setTimeout(() => {
        //reject('so halt');
        resolve(action);
        savedUser();
    }, 1000);
}

saveUser
    .then(checkForUserDuplicateAsync)
    .then(saveUserAsync)
    .catch((reason) => {
        console.log('logging the reason:', reason);
        savingUserAborted();
    });

export var savePerson = Action
    .create<{name:string, lastname:string, age:number}, string, string, number>(
    (name:string, lastname:string, age:number) => {
        return {
            name,
            lastname,
            age
        };
    }, 'savePerson'
);

export var sendMail = Action
    .create<{
    name:string, lastname:string, email:string, subject:string, body:string
}, string, string, string, string, string>(
    (name:string, lastname:string, email:string, subject:string, body:string) => {
        return {
            name,
            lastname,
            email,
            subject,
            body
        };
    }, 'sendMail'
);

export var userUpdated = Action.create('userUpdated');