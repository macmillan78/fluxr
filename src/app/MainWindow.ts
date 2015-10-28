import { Component, DOMElement } from 'common/Component';
import { Selectable } from 'components/Selectable';
import { Tabbed } from 'components/Tabbed';
import { Accordion } from 'components/Accordion';
import { Slider } from 'components/Slider';
import { reloadAll, saveTask, Task, loadUser, saveUser, savePerson, sendMail } from 'app/actions';
import { userStore } from 'app/stores';

export default class MainWindow extends Component {
    private input1;
    private input2;
    private select1;
    private selectableValue;

    private userStore = userStore;

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
        saveUser(this.input1, this.input2);
        //savePerson('Linnenfelser', 'Marcel', 37);
        //sendMail('Linnenfelser', 'Marcel', 'ml@synflag.com', 'Subject', 'Mail Body');
    }
}