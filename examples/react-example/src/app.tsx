import * as React from 'react';

import {
    render
} from 'react-dom';

import {
    Store,
    isChangeByOneOfStores,
    initStores,
} from 'fluxr';

import {
    Todo,
    debugStore,
    completedCountStore, todoStore, addTodo, toggleCompleteTodo,  deleteTodo,
    completedCountStore2, todoStore2, addTodo2, toggleCompleteTodo2,  deleteTodo2
} from './bootstrap';

import { DebugPanel } from './DebugPanel';


interface AppState {
  todos:Todo[];
  completedCount:number;
}

interface AppProps {
  config:any;
}

class App extends React.Component<AppProps, AppState> {
  constructor(props) {
    super(props);

    this.state = {
      todos: [],
      completedCount: 0
    };
  }

  componentDidMount() {
    Store.source.filter(isChangeByOneOfStores([this.props.config.todoStore])).subscribe(
        (change) => this.setState({
          todos: change.state
        })
    );
    Store.source.filter(isChangeByOneOfStores([this.props.config.completedCountStore])).subscribe(
        (change) => this.setState({
          completedCount: change.state
        })
    );
    //Observable.combineLatest(
    //    Store.source.filter(isChangeByOneOfStores([todoStore])),
    //    Store.source.filter(isChangeByOneOfStores([completedCountStore])),
    //    (todos, completedCount) => {
    //        return { todos, completedCount };
    //    }
    //).subscribe(
    //    (change) => this.setState({
    //        todos: change.todos.state,
    //        completedCount: change.completedCount.state
    //    })
    //);
    initStores();

    //addTodo({
    //    id: 1
    //    text: 1
    //    completed: false
    //});
    //addTodo({
    //    id: 2
    //    text: 2
    //    completed: false
    //
    //});
    //addTodo({
    //    id: 3
    //    text: 3
    //    completed: false
    //});
    //addTodo({
    //    id: 4
    //    text: 4
    //    completed: false
    //});
    //addTodo({
    //    id: 5
    //    text: 5
    //    completed: false
    //});
    //addTodo({
    //    id: 6
    //    text: 6
    //    completed: false
    //});
  }

  render() {
    const todos = this.state.todos;

    return (<div>
      <h1>The App</h1>
      <input ref="todoInput" onKeyPress={ (event) => this.onKeyPress(event) }/>
      <button onClick={ () => this.onAddTodo() }>Button</button>
      <br/>
      <table>
        <tbody>
          { todos.map((todo) => this.renderTodo(todo)) }
        </tbody>
      </table>
      <br/>
      <strong>{ todos.length } / { this.state.completedCount }</strong>
    </div>);
  }

  renderTodo(todo) {
    return (<tr>
      <td className={ todo.completed ? 'completed' : '' }>
        <button onClick={ () => this.props.config.toggleCompleteTodo(todo.id)}>✓</button>
        <button onClick={ () => this.props.config.deleteTodo(todo.id) }>✗</button>
        { todo.text }
      </td>
    </tr>)
  }

  onKeyPress(event) {
    if (event.which == 13) {
      this.onAddTodo();
    }
  }

  onAddTodo() {
    let value                 = this.refs.todoInput.value;
    this.refs.todoInput.value = '';
    this.props.config.addTodo({
      id: -1,
      text: value,
      completed: false
    });
  }
}

const column = {
  float: 'left',
  width: '30%'
};
const config = {
  completedCountStore, todoStore, addTodo, toggleCompleteTodo, deleteTodo
};
let config2  = {
  completedCountStore: completedCountStore2,
  todoStore: todoStore2,
  addTodo: addTodo2,
  toggleCompleteTodo: toggleCompleteTodo2,
  deleteTodo: deleteTodo2
};
render(
    (<div>
      <div style={column}>
        <App config={config}/>
      </div>
      <div style={column}>
        <App config={config2}/>
      </div>
      <DebugPanel debugStore={debugStore}/>
    </div>),
    document.getElementsByClassName('app-container')[0]
);
