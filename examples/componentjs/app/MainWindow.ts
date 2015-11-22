import { Component, DOMElement } from 'common/Component';
import { Selectable } from 'components/Selectable';
import { Tabbed } from 'components/Tabbed';
import { Accordion } from 'components/Accordion';
import { Slider } from 'components/Slider';
import { Store } from '../lib/Store';
import {
    isChangeByStore,
    isChangeByAction,
    changeStateHoldsPredicate
} from '../lib/helpers';
import { reloadAll, saveTask, loadUser, saveUser, savePerson, sendMail,
    hideLoadingIndicator} from 'app/actions';
import { userStore } from 'app/stores';
import {
    User
} from 'app/data';
import { Observable } from 'rx';

export default class MainWindow extends Component {
    private input1;
    private input2;
    private select1;
    private selectableValue;

    protected getInitialState():Object {
        return {
            users: []
        };
    }

    componentDidMount():void {
        this.withChildElements({
            form: 'form',
            input1: '#input1',
            input2: '[name=input2]',
            select1: '[name=select1]',
            submit: 'input[type=submit]',
            button: '#mybutton',
            userTable: '.user-table'
        });

        this.on('submit', 'form', this.onSubmit);

        this.bind('input1');
        this.bind('input2');
        this.bind('select1');

        this.add('selectable', Selectable, {}, 'selectable');
        this.add('tabbed', Tabbed, {}, 'tabbed');

        this.add('accordion', Accordion, {}, 'accordion');

        this.add('slider', Slider, {}, 'slider');
        this.add('sliderv', Slider, {
            orientation:Slider.VERTICAL,
            minValue: -5
        }, 'sliderv');

        this.bindState('selectable', 'value', 'selectableValue');

        this.get('sliderv')[0].addStateObserver((oldState, newState) => {
            var element:any = this.getChildElements('input1')[0].get();
            element.value = newState.value;
        });

        let subscription = Observable.fromEvent(this.getChildElements('form')[0].get(), 'submit')
            .debounce(500).subscribe(() => {
                saveUser(this.input1, this.input2);
            });

        Store.source
            .filter(isChangeByStore(userStore))
            .filter(isChangeByAction(saveUser))
            .filter(changeStateHoldsPredicate<User[]>(user => user.length > 3))
            .map<User[]>(storeChange => storeChange.state)
            .subscribe((state) => this.setState({
                users: state
            }));
    }

    onSubmit(event:Event, element: DOMElement):void {
        event.preventDefault();
        //console.log(
        //    event,
        //    element,
        //    this.input1,
        //    this.input2,
        //    this.select1,
        //    this.selectableValue
        //);
        //reloadAll();
        //saveTask(new Task(this.input1, true, new Date(), false));
        //loadUser('username');
        //savePerson('Linnenfelser', 'Marcel', 37);
        //sendMail('Linnenfelser', 'Marcel', 'ml@synflag.com', 'Subject', 'Mail Body');

        (<HTMLInputElement>this.getChildElements('input1')[0].get()).value = '';
        (<HTMLTextAreaElement>this.getChildElements('input2')[0].get()).value = '';
        saveUser(this.input1, this.input2);
    }

    protected stateChanged(oldState:any, newState:any):void {
        let table = this.getChildElements('userTable')[0].get();

        let html = newState.users.map((user) => {
            return `<tr><td>${user.username}</td><td>${user.password}</td></tr>`;
        });

        table.innerHTML = html.join('');
    }
}