import { DOMElement } from 'common/Component';
import { Selectable } from 'components/Selectable';
import assignObject from 'assign';

export class Accordion extends Selectable {
    protected getDefaultAttributes():Object {
        return {
            optionSelector: ':scope > title',
            contentSelector: ':scope > content',
            hiddenSelector: ':scope > input[type=hidden]',
            selectedClass: 'is-selected'
        };
    }

    protected getChildElementSelectors():Object {
        let selectors = super.getChildElementSelectors();

        return assignObject(selectors, {
            content: this.attributes.contentSelector
        });
    }

    protected stateChanged(oldState:any, newState:any):void {
        super.stateChanged(oldState, newState);

        let content = this.getChildElements('content');

        content[oldState.index].removeClass(this.attributes.selectedClass);
        content[newState.index].addClass(this.attributes.selectedClass);
    }
}
