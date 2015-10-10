/// <reference path="../../typings/common/zepto.d.ts"/>
/// <reference path="../../typings/common/assign.d.ts"/>
import $ from 'zepto';
import assignObject from 'assign';

export class DOMElement {
    private $node;
    private node;

    constructor(node:Node) {
        this.node = node;
        this.$node = $(node);
    }

    public get():Element {
        return this.node;
    }

    public addClass(classString:string) {
        this.$node.addClass(classString);
    }

    public removeClass(classString:string):DOMElement {
        this.$node.removeClass(classString);

        return this;
    }

    public val(value?:string):string {
        if (value) {
            return this.$node.val(value);
        } else {
            return this.$node.val();
        }
    }

    public on(event:string, func:Function):DOMElement;
    public on(event:string, selector:string, func:Function):DOMElement;

    public on(event:string, param1:any, param2?:Function):DOMElement {
        if (typeof param1 == 'string' && typeof param2 == 'function') {
            this.$node.on(event, param1, param2);
        } else {
            this.$node.on(event, param1);
        }

        return this;
    }

    public off(event?:string):DOMElement {
        if (event) {
            this.$node.off(event);
        } else {
            this.$node.off();
        }

        return this;
    }

    public find(selector):Array<DOMElement> {
        var elements:Array<DOMElement> = [];

        this.$node.find(selector).each((number:Number, element:Element) => {
            elements.push(new DOMElement(element));
        });

        return elements;
    }

    public data(attributeSuffix:string):any {
        return this.$node.data(attributeSuffix);
    }

    public trigger(eventType:string, extraParameters:any[]|Object):void {
        this.$node.trigger(eventType, extraParameters);
    }

    public index():Number {
        return this.$node.index();
    }
}

interface ChildElementSelectors {
    [name:string]: string;
}

/**
 * abstracts from jquery
 */
class BaseComponent {
    protected node:DOMElement;
    protected dataAttribute:string;
    protected useDataAttributeSelector:boolean = false;
    protected childElementSelectors:ChildElementSelectors;
    private static LASTIDCOUNT:number = 0;
    private ID:string;

    constructor(node:HTMLElement) {
        this.node = new DOMElement(node);

        this.ID = 'Component' + this.getNextIdCount();

        node.setAttribute('data-component-id', this.ID);
    }

    protected getNextIdCount() {
        return ++BaseComponent.LASTIDCOUNT;
    }

    protected getID():string {
        return this.ID;
    }

    protected setDataAttribute(attr:string):void {
        this.dataAttribute = attr;
    }

    protected setChildElementSelectors(selectors:ChildElementSelectors):void {
        this.childElementSelectors = selectors;
    }

    public getSelector(subElementName?:string):string {
        if (this.useDataAttributeSelector) {
            if (subElementName) {
                return '[data-' + this.dataAttribute + '=' + subElementName + ']';
            } else {
                return '[data-' + this.dataAttribute + ']';
            }
        } else {
            if (!subElementName) {
                throw 'With child element selectors a name is needed';
            }
            if (!this.childElementSelectors.hasOwnProperty(subElementName)) {
                throw `Unknown child element name '${subElementName}'`;
            }
            return Component.preprocessSelector(this, this.childElementSelectors[subElementName]);
        }
    }

    public static preprocessSelector(component:BaseComponent, selector:string):string {
        return selector.replace(/:scope/, `[data-component-id=${component.getID()}]`);
    }

    public on(event:string, func:(event:Event, data:any) => void):BaseComponent;
    public on(event:string, selector:string, func:(event:Event, element:DOMElement, data:any) => void):BaseComponent;

    public on(event:string, selector:any, func?:(event:Event, element:DOMElement, data:any) => void):BaseComponent {
        var _this = this;
        if (typeof selector == 'function') {
            this.node.on(event, function (event, data) {
                selector.bind(_this)(event, new DOMElement(event.target), data);
            });
        } else {
            this.node.on(event, this.getSelector(selector), function (event, data) {
                func.bind(_this)(event, new DOMElement(event.target), data);
            });
        }

        return this;
    }

    public off(event?:string):void {
        if (event) {
            this.node.off(event);
        } else {
            this.node.off();
        }
    }

    protected find(selector:string):DOMElement[] {
        return this.node.find(selector);
    }

    protected data(attributeSuffix:string):any {
        return this.node.data(attributeSuffix);
    }

    public trigger(eventType:string, extraParameters:any[]|Object):BaseComponent {
        this.node.trigger(eventType, extraParameters);

        return this;
    }
}

class ComponentRegistry {
    private components = [];

    public add(component:Component):void {
        this.components.push(component);
    }

    public remove(component:Component):void {
        var position = this.components.indexOf(component);

        if (position > -1) {
            this.components.splice(position, 1);
        }
    }

    public tearDownAll():void {
        this.components.map((component) => {
            component.tearDown();
        });

        this.components = [];
    }
}

export class Component extends BaseComponent {

    private parent:Component;
    protected childrenMap:{[key:string]:Component[]} = {};
    protected state:any;
    protected requiredChildElements:Array<string> = [];
    protected childElementMap:{[key:string]:DOMElement[]} = {};
    protected attributes:any;
    static registry:ComponentRegistry = new ComponentRegistry();
    protected stateObservers:((oldState:any, newState:any) => any)[] = [];

    constructor(node:HTMLElement, attributes:Object) {
        super(node);

        Component.registry.add(this);

        this.attributes = assignObject({}, this.getDefaultAttributes(), attributes);
        this.childrenMap = {};

        this.componentDidMount();

        // call initial state after componentDidMount, to be able to calculate state properties
        this.state = this.getInitialState();
        this.stateChanged(this.state, this.state);
    }

    protected getInitialState():Object {
        return {};
    }

    protected getDefaultAttributes():Object {
        return {};
    }

    protected setState(state:Object):void {
        var oldState = this.state;
        this.state = assignObject({}, this.state, state);

        for (let prop in this.state) {
            if (this.state.hasOwnProperty(prop) && this.state[prop] !== oldState[prop]) {
                this.handleStateChanged(oldState, this.state);

                return;
            }
        }
    }

    public getState():any {
        return this.state;
    }

    public addStateObserver(observer:(oldState:any, newState:any) => any):void {
        this.stateObservers.push(observer);
    }

    private notifyStateObservers(oldState:any, newState:any):void {
        this.stateObservers.map((observer) => {
            observer(oldState, newState);
        });
    }

    private handleStateChanged(oldState:any, newState:any):void {
        this.stateChanged(oldState, newState);
        this.notifyStateObservers(oldState, newState);
    }

    protected stateChanged(oldState:any, newState:any):void {
        // do nothing
    }

    public setParent(parent:Component):void {
        this.node.get().setAttribute('data-parent', parent.getID());
        this.parent = parent;
    }

    public getParent():Component {
        return this.parent;
    }

    public has(name:string):boolean {
        return this.childrenMap.hasOwnProperty(name);
    }

    /**
     * Get child component
     *
     * @param name Name, if named or index
     * @returns {any}
     */
    public get(name:any):Component[] {
        if (this.has(name)) {
            return this.childrenMap[name];
        } else {
            return null;
        }
    }

    public add(selector:string,
               ComponentClass:new (node:Node, attributes:Object) => Component,
               attributes:any,
               name:string):Component {
        Component.attachTo(
            ComponentClass,
            [this, selector],
            attributes,
            (child) => {
                if (!this.childrenMap.hasOwnProperty(name)) {
                    this.childrenMap[name] = [];
                }
                child.setParent(this);
                this.childrenMap[name].push(child);
            });

        return this;
    }

    public remove(name:string):Component {
        delete this.childrenMap[name];

        return this;
    }

    protected getChildElements(name:string):DOMElement[] {
        if (this.childElementMap.hasOwnProperty(name)) {
            return this.childElementMap[name];
        }

        return [];
    }

    protected addChildElement(name:string, element:Element):Component {
        if (this.childElementMap.hasOwnProperty(name)) {
            this.childElementMap[name].push(new DOMElement(element));
        } else {
            this.childElementMap[name] = [new DOMElement(element)];
        }

        return this;
    }

    protected hasChildElement(name:string):boolean {
        return this.childElementMap.hasOwnProperty(name);
    }

    protected setRequiredChildElements(subcomponentIdentifiers:string[]):Component {
        this.requiredChildElements = subcomponentIdentifiers;

        return this;
    }

    protected setRequiredAttributes(attributeKeys:string[]):Component {
        attributeKeys.map((key) => {
            if (!this.attributes.hasOwnProperty(key)) {
                throw 'attribute \'' + key + '\' is missing';
            }
        });

        return this;
    }

    protected removeChildElements(name?:string):void {
        if (name) {
            delete this.childElementMap[name];
        } else {
            this.childElementMap = {};
        }
    }

    private validateRequiredChildElements():boolean|string {
        for (var index = 0; index < this.requiredChildElements.length; index++) {
            if (!this.hasChildElement(this.requiredChildElements[index])) {
                return this.requiredChildElements[index];
            }
        }

        return true;
    }

    /**
     * With jquery selectors:
     * [
     *  {
     *   selector: '.some-selector',
     *   name: 'the identifier to use'
      * }
     * ]
     *
     * @param dataAttributeOrArrayWithChildSelectors
     * @returns {Component}
     */
    public withChildElements(dataAttributeOrArrayWithChildSelectors:any):Component {
        if (typeof dataAttributeOrArrayWithChildSelectors == 'string') {
            this.useDataAttributeSelector = true;
        }
        this[this.useDataAttributeSelector ? 'setDataAttribute' : 'setChildElementSelectors'](dataAttributeOrArrayWithChildSelectors);

        if (this.useDataAttributeSelector) {
            this.addChildElementsWithDataAttribute();
        } else {
            this.addChildElementsWithChildSelectors();
        }

        let missing;
        if ((missing = this.validateRequiredChildElements()) !== true) {
            throw 'sub element \'' + missing + '\' is missing';
        }

        return this;
    }

    private addChildElementsWithDataAttribute() {
        let nodes = this.find(this.getSelector());

        nodes.forEach((element:DOMElement) => {
            this.addChildElement(element.data(this.dataAttribute), element.get());
        });
    }

    private addChildElementsWithChildSelectors() {
        var keys = Object.keys(this.childElementSelectors);

        keys.forEach((key) => {
            let nodes = this.find(this.getSelector(key));

            nodes.forEach((element:DOMElement) => {
                element.get().setAttribute('data-attached-to', this.getID());
                this.addChildElement(key, element.get());
            });
        });
    }

    protected bind(childElement:string, propertyName:string = null):void {
        var onInput = () => {
            this[propertyName === null ? childElement : propertyName] = this.childElementMap[childElement][0].val();
        };
        this.childElementMap[childElement][0].on('input', onInput);
        onInput();
    }

    protected bindState(childComponent:string, statePropertyName:string, propertyName:string = null):void {
        if (this.childrenMap.hasOwnProperty(childComponent) && this.childrenMap[childComponent].length > 0) {
            let initialState = this.childrenMap[childComponent][0].getInitialState();

            this[propertyName !== null ? propertyName : statePropertyName] = initialState[statePropertyName];

            this.childrenMap[childComponent][0].addStateObserver((oldState, newState) => {
                if (oldState[statePropertyName] !== newState[statePropertyName]) {
                    this[propertyName !== null ? propertyName : statePropertyName] = newState[statePropertyName];
                }
            });
        } else {
            throw `Child component '${childComponent}' not registered.`;
        }
    }

    public tearDown():void {
        this.off();
        this.removeChildElements();
        for (var i in this.childrenMap) {
            if (this.childrenMap.hasOwnProperty(i)) {
                this.childrenMap[i].map((child) => {
                    child.tearDown();
                });
            }
        }
        this.childrenMap = {};
        this.stateObservers = [];
    }

    public static attachTo(Component:new (node:Node, attributes:Object) => Component,
                           selector:any,
                           attributes:Object = {},
                           instanceCallback:(element:Component) => any = null):void {
        let nodes:any;
        if (typeof selector === 'string') {
            nodes = document.querySelectorAll(selector);
        } else if (Object.prototype.toString.call(selector) == '[object Array]' && selector[0] && selector[1]) {
            let nodeSelector = selector[1];
            if (selector[0] instanceof Component) {
                nodeSelector = BaseComponent.preprocessSelector(selector[0], nodeSelector);
            }
            nodes = selector[0].node.get().querySelectorAll(nodeSelector);
        } else {
            nodes = [selector];
        }

        for (var index = 0; index < nodes.length; index++) {
            let instance = new Component(nodes[index], attributes);

            if (instanceCallback != null) {
                instanceCallback(instance);
            }
        }
    }

    protected componentDidMount():void {
        throw 'override componentDidMount';
    }

}
