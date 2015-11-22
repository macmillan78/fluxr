export interface User {
    username:string;
    password:string
}

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


