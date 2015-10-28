import { Action, ActionFunction3 } from 'common/flux/Action';

export var reloadAll = Action.create('reloadAll');

export class Task {
    private _name:string;
    private _completed:boolean;
    private _time:Date;
    private _archived:boolean;

    constructor(name:string, completed:boolean, time:Date, archived:boolean) {
        this._name = name;
        this._completed = completed;
        this._time = time;
        this._archived = archived;
    }

    get name():string {
        return this._name;
    }

    get completed():boolean {
        return this._completed;
    }

    get time():Date {
        return this._time;
    }

    get archived():boolean {
        return this._archived;
    }
}

export var saveTask = Action.create<Task>('saveTask');

export var loadUser = Action
    .create<{username:string}, string>(
    (username:string) => {
        return {
            username
        };
    }, 'loadUser'
);

export var saveUser = Action
    .create<{username:string, password:string}, string, string>(
    (username:string, password:string) => {
        return {
            username,
            password
        };
    }, 'saveUser'
);

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