import MainWindow from 'components/MainWindow';
import { Component } from 'common/Component';

class Application {
    public run() : void {
        MainWindow.attachTo(
            MainWindow,
            '.js-app-container',
            {
                attr1: 'value1'
            },
            (component:Component) => {
                //console.log(component);
            }
        );
    }
}

new Application().run();