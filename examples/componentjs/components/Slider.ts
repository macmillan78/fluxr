import { Component, DOMElement, Offset } from 'common/Component';
import assignObject from 'assign';

export class Slider extends Component {
    static VERTICAL:string = 'vertical';
    static HORIZONTAL:string = 'horizontal';

    private clientProp:string;
    private styleProp:string;
    private maxPos:number;
    private handleSize:number;

    private numSteps:number;

    private handle:DOMElement;
    private hidden:DOMElement;
    private range:DOMElement;

    protected getInitialState():Object {
        var state:any = this.getStateForValue(this.attributes.initialValue);

        return assignObject({}, state, this.stateValues(state.position));
    }

    protected getStateForValue(value:number):Object {
        return {
            value: value,
            position: this.maxPos / (this.attributes.maxValue - this.attributes.minValue)
                * (value - this.attributes.minValue),
            delta: 0
        }
    }

    public setValue(value:number):void {
        this.setState(this.getStateForValue(value));
    }

    protected getDefaultAttributes():Object {
        return {
            initialValue: 7,
            orientation: Slider.HORIZONTAL,
            maxValue: 10,
            minValue: 5,
            stepSize: 1,
            snapPosition: true
        };
    }

    protected componentDidMount():void {
        this.withChildElements({
            handle: ':scope > handle',
            hidden: ':scope > input[type=hidden]',
            range: ':scope > range'
        });

        this.initializeProperties();

        this.initializeEventHandlers();
    }

    private initializeEventHandlers() {
        let offset:Offset;

        let mouseMove = (event:any, element:DOMElement) => {
            if (offset == null) return;

            let pos = event[this.clientProp] - offset[this.styleProp];

            this.setState(this.stateValues(pos));
        };

        let mouseUp = (event:any, element:DOMElement) => {
            offset = null;

            this.off('mousemove', document);
            this.off('mouseup', document);
        };

        this.on('mousedown', 'handle', (event:any, element:DOMElement) => {
            offset = this.offset();

            this.on('mousemove', document, mouseMove);
            this.on('mouseup', document, mouseUp);
        });
        this.on('mousemove', document, mouseMove);
        this.on('mouseup', document, mouseUp);

        this.on('click', 'handle', (event:Event, element:DOMElement) => {
            event.stopPropagation();
            event.preventDefault();
        });

        this.on('click', (event:Event, element:DOMElement) => {
            event.stopPropagation();
            event.preventDefault();

            this.setState(this.stateValues(event[this.clientProp] - this.offset()[this.styleProp]));
        });
    }

    private initializeProperties() {
        ['handle', 'hidden', 'range'].forEach((elem) => {
            if (this.hasChildElement(elem)) {
                this[elem] = this.getChildElements(elem)[0];
            }
        });

        this.clientProp = this.attributes.orientation == Slider.HORIZONTAL ? 'clientX' : 'clientY';
        this.styleProp = this.attributes.orientation == Slider.HORIZONTAL ? 'left' : 'top';

        this.numSteps = (this.attributes.maxValue - this.attributes.minValue) / this.attributes.stepSize;

        if (this.attributes.orientation == Slider.HORIZONTAL) {
            this.handleSize = this.getChildElements('handle')[0].get().clientWidth;
            this.maxPos = this.node.get().clientWidth - this.handleSize;
        } else {
            this.handleSize = this.getChildElements('handle')[0].get().clientHeight;
            this.maxPos = this.node.get().clientHeight - this.handleSize;
        }
    }

    protected stateValues(position:number):Object {
        let currentPos = position - this.handleSize / 2;

        let num = Math.round(currentPos / (this.maxPos/(this.attributes.maxValue - this.attributes.minValue)) / this.attributes.stepSize);

        if (num < 0) {
            num = 0;
        } else if (num > this.numSteps) {
            num = this.numSteps;
        }

        const value = num * this.attributes.stepSize + this.attributes.minValue;

        if (this.attributes.snapPosition) {
            currentPos = this.maxPos / this.numSteps * num;
        }

        if (currentPos < 0) {
            currentPos = 0;
        } else if (currentPos > this.maxPos) {
            currentPos = this.maxPos;
        }

        return {
            position: currentPos,
            value: value
        };
    }

    protected stateChanged(oldState:any, newState:any):void {
        this.handle.get().style[this.styleProp] = newState.position + 'px';
        var hidden:any = this.hidden ? this.hidden.get() : null;
        if (hidden) hidden.value = newState.value;
        var range = this.range ? this.range.get() : null;
        if (range) range.style[this.styleProp == 'left' ? 'width' : 'height'] = (newState.position + this.handleSize / 2) + 'px';
    }
}
