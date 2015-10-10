declare interface ZeptoFunc {
    (node:Node):any;
    (selector:string):any;
}

declare var Zepto:ZeptoFunc;
declare module "zepto" {
    export default Zepto;
}
