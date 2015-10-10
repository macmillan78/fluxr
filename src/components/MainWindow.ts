import { Component, DOMElement } from 'common/Component';

class Selectable extends Component {
    protected getInitialState():Object {
        return {
            index: 0,
            value: this.getChildElements('option')[0].data('value')
        };
    }

    protected getDefaultAttributes():Object {
        return {
            optionSelector: ':scope > option',
            hiddenSelector: ':scope > input[type=hidden]',
            selectedClass: 'is-selected'
        };
    }

    protected componentDidMount():void {
        this.withChildElements({
                option: this.attributes.optionSelector,
                hidden: this.attributes.hiddenSelector
            });

        this.on('click', 'option', (event:Event, element:DOMElement) => {
            this.setState({
                index: element.index(),
                value: element.data('value')
            });
        });
    }

    protected stateChanged(oldState:any, newState:any):void {
        let options = this.getChildElements('option');
        let hidden = this.getChildElements('hidden');

        hidden.map((hidden) => {
            hidden.val(newState.value);
        });

        options[oldState.index].removeClass(this.attributes.selectedClass);
        options[newState.index].addClass(this.attributes.selectedClass);
    }
}

class Tabbed extends Component {
    protected getInitialState():Object {
        return {
            index: 0
        };
    }

    protected getDefaultAttributes():Object {
        return {
            contentSelector: ':scope > .js-content',
            selectedClass: 'is-selected'
        };
    }

    protected componentDidMount():void {
        this.withChildElements({
            content: this.attributes.contentSelector
        });

        this.add(':scope > tabs', Selectable, {
                optionSelector: ':scope > tab',
            }, 'tabcontainer');

        this.get('tabcontainer')[0].addStateObserver((oldState, newState) => {
            this.setState({
                index: newState.index
            });
        });
    }

    protected stateChanged(oldState:any, newState:any):void {
        let contents = this.getChildElements('content');

        contents[oldState.index].removeClass(this.attributes.selectedClass);
        contents[newState.index].addClass(this.attributes.selectedClass);
    }
}

export default class MainWindow extends Component {
    private input1;
    private input2;
    private select1;
    private selectableValue;

    componentDidMount():void {
        this.withChildElements({
            form: 'form',
            input1: '#input1',
            input2: '[name=input2]',
            select1: '[name=select1]',
            submit: 'input[type=submit]'
        });

        this.on('submit', 'form', this.onSubmit);

        this.bind('input1');
        this.bind('input2');
        this.bind('select1');

        this.add('selectable', Selectable, {}, 'selectable');
        this.add('tabbed', Tabbed, {}, 'tabbed');

        this.bindState('selectable', 'value', 'selectableValue');
    }

    onSubmit(event:Event, element: DOMElement):void {
        event.preventDefault();
        console.log(
            event,
            element,
            this.input1,
            this.input2,
            this.select1,
            this.selectableValue
        );
    }
}