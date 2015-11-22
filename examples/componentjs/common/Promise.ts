export class Promise<T> {
    private resolveHandler:(value:T) => any;
    private rejectHandler:(reason:any) => any;
    private followUp:Promise<T>;
    private followUpResolve:(value:T) => any;
    private followUpReject:(reason:any) => any;
    private isResolved:boolean;
    private isRejected:boolean;
    private value:T;
    private reason:any;
    constructor(handler:(resolve:(value:T) => any, reject:(reason:any) => any) => any) {
        this.isResolved = false;

        handler((value) => {
            this.resolve(value);
        }, (reason) => {
            this.reject(reason);
        });
    }

    private resolve(value:T) {
        if (this.isRejected) throw 'Promise is already rejected!';
        if (this.isResolved) throw 'Promise is already resolved!';

        this.isResolved = true;
        this.value = value;

        if (this.resolveHandler) {
            this.resolveHandler(value);
            this.followUpResolve(this.value);
        }
    }

    private reject(reason:any) {
        if (this.isRejected) throw 'Promise is already rejected!';
        if (this.isResolved) throw 'Promise is already resolved!';

        this.isRejected = true;
        this.reason = reason;

        if (this.rejectHandler) {
            this.rejectHandler(reason);
            this.followUpReject(this.reason);
        }
    }

    private createFollowUpPromise() {
        if (!this.followUp) {
            this.followUp = new Promise<T>((resolve, reject) => {
                this.followUpReject = reject;
                this.followUpResolve = resolve;
            });
        }

        return this.followUp;
    }

    public then(resolveHandler:(value:T) => any):Promise<T> {
        let followUp = this.createFollowUpPromise();
        this.resolveHandler = resolveHandler;

        if (this.isResolved) {
            this.resolveHandler(this.value);
            this.followUpResolve(this.value);
        }

        return followUp;
    }

    public catch(rejectHandler:(reason:any) => any):Promise<T> {
        let followUp = this.createFollowUpPromise();

        this.rejectHandler = rejectHandler;
        if (this.isRejected) {
            this.rejectHandler(this.reason);
            this.followUpReject(this.reason);
        }

        return followUp;
    }
}