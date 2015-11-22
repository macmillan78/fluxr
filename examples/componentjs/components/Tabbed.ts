import { Component, DOMElement } from 'common/Component';
import { Selectable } from 'components/Selectable';

export class Tabbed extends Component {
    protected getInitialState():Object {
        return {
            index: 0
        };
    }

    protected getDefaultAttributes():Object {
        return {
            contentSelector: ':scope > .js-content',
            handleContainerSelector: ':scope > tabs',
            handleSelector: ':scope > tab',
            selectedClass: 'is-selected'
        };
    }

    protected componentDidMount():void {
        this.withChildElements({
            content: this.attributes.contentSelector
        });

        this.add(this.attributes.handleContainerSelector, Selectable, {
            optionSelector: this.attributes.handleSelector,
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
