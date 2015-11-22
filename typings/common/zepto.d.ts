declare interface ZeptoFunc {
    (node:Node):any;
    (selector:string):any;
    ajax:any;
}

declare var Zepto:ZeptoFunc;
declare module "zepto" {
    export default Zepto;
}
