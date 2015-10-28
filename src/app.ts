import MainWindow from 'app/MainWindow';
import { Component } from 'common/Component';
import { reloadAll, saveTask, Task, loadUser, saveUser, savePerson, sendMail, userUpdated } from 'app/actions';
import { Observable,Subject } from 'rx';
import { Action } from 'common/flux/Action';

class Application {
    public run() : void {

        var next = (elem) => {
            console.log('next', elem, elem.action == reloadAll, elem.is(reloadAll));
        };
        var err = (err) => {
            console.log('error', err);
        };
        var completed = () => {
            console.log('completed');
        };

        //var sub1 = new Subject<number>();
        //var sub2 = new Subject<number>();
        //var sub1c = 0;
        //var sub2c = 1000;
        //
        //var taken = sub1.takeUntil(sub2).toArray();
        //
        //sub2.subscribe(() => {
        //    taken.subscribe((x) => {
        //        console.log('array:', x);
        //    });
        //});
        //
        //Observable.interval(517).timeInterval().subscribe(function(x) {
        //    sub1c++;
        //    console.log('1:', sub1c);
        //    sub1.onNext(sub1c);
        //});
        //Observable.interval(2000).timeInterval().subscribe(function(x) {
        //    sub2c++;
        //    console.log('2:', sub2c);
        //    sub2.onNext(sub2c);
        //});

        //[reloadAll, saveTask, loadUser, saveUser, savePerson, sendMail].forEach((elem:any) => {
        //    elem.source.subscribe(next, err, completed);
        //});

        //var source = Action.source;
        //
        //source.filter(elem => elem.is(reloadAll)).subscribe((elem) => {
        //    console.log('reloadAll', elem.is(reloadAll));
        //    loadUser('a user');
        //}, err, completed);
        //
        //source.filter(elem => elem.is(loadUser)).subscribe((elem) => {
        //    console.log('loadUser', elem.is(loadUser));
        //    userUpdated();
        //}, err, completed);
        //
        //Observable.when(
        //    source.filter(elem => elem.is(reloadAll))
        //    .and(source.filter(elem => elem.is(userUpdated)))
        //    .thenDo((first, second) => {
        //        console.log(first, second);
        //
        //        return {
        //            first,
        //            second
        //        };
        //    })
        //).subscribe((elem) => {
        //        console.log('reloadAll and userUpdated', elem);
        //}, err, completed);

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