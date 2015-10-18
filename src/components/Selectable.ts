import { Component, DOMElement } from 'common/Component';

export class Selectable extends Component {
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

    protected getChildElementSelectors():Object {
        return {
            option: this.attributes.optionSelector,
            hidden: this.attributes.hiddenSelector
        };
    }

    protected componentDidMount():void {
        this.withChildElements(this.getChildElementSelectors());

        this.on('click', 'option', (event:Event, element:DOMElement) => {
            this.setState({
                index: element.data('index'),
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
