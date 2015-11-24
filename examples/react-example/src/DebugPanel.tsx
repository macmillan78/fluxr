import * as React from 'react';

import {
    render
} from 'react-dom';

import * as JSONTree from 'react-json-tree';
import * as Button from 'react-button';
import { TangleText } from './TangleText.jsx';
import {
    Store,
    DebugState as DebugStoreState,
    DebugHistoryState,
    DebugMode,
    isChangeByOneOfStores,
    MetaStore,
    StoreChange,
    DebugActions
} from 'fluxr';

interface DebugStoreProps {
  currentState:number;
  state:DebugStoreState;
  index: number;
  mode: DebugMode,
  key:number
}

const styles = {
  button: {
    color: 'white',
    height: '20px'
  },
  buttonContainer: {
    float: "right"
  },
  path: {
    color: '#268bd2',
    fontSize: '0.90em'
  },
  deleted: {
    color: 'red',
    textDecoration: 'line-through'
  },
  added: {
    color: 'green',
    textDecoration: 'none'
  },
  diffContainer: {
    padding: '0 0 16px 16px'
  },
  container: {
    position: 'absolute',
    top: '0px',
    right: '0px',
    height: '100%',
    width: '300px',
    backgroundColor: '#2b313b',
    color: 'white',
    fontFamily: 'Courier',
    fontSize: '14px',
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    padding: '3px'
  },
  scrollArea: {
    overflowY: 'auto',
    flexGrow: '1'
  },
  slider: {
    width: '30px',
    cursor: 'move'
  },
  footer: {
    textAlign: 'center'
  }
};

class DebugState extends React.Component<DebugStoreProps, {}> {
  constructor(props) {
    super(props);
  }

  render() {
    const light    = this.props.index > this.props.currentState;
    const inactive = this.props.state.inactive;
    const mode     = this.props.mode;


    let headlineStyle = {
      margin: 0,
      backgroundColor: '#4f5a65',
      backgroundColor: inactive ? '#654f5a' : '#4f5a65',
      fontWeight: 'normal',
      padding: '8px 0 8px 20px',
      color: light ? '#676a70' : 'white',
      textDecoration: inactive ? 'line-through' : 'none'
    };

    let stateDisplay = {
      opacity: light ? 0.4 : 1
    };

    return (
        <div>
          <h3 style={headlineStyle}>
            {this.props.state.action.id}
            <span style={styles.buttonContainer}>
              {this.props.index == 0 ? null : <Button style={styles.button} onClick={event => {
              event.stopPropagation();
              DebugActions.toggleStateActive(this.props.state);
            }}>{inactive ? '+' : '-'}</Button>}
              <Button
                  style={styles.button}
                  onClick={() => DebugActions.jumpToState(this.props.state)}>&lt;
              </Button>
            </span>
          </h3>
          { inactive ? null :
          <div style={stateDisplay}>
            {this.props.state.action.payload ?
            <JSONTree expandRoot={false} keyName={'action'} data={this.props.state.action.payload}/> :
                null }
            { mode == DebugMode.STATE || mode == DebugMode.FULLSTATE ?
            <JSONTree keyName={'state'} data={this.props.state.state}/> : null }
            { (mode == DebugMode.DIFF ? (<div style={styles.diffContainer}>{
                this.renderDiff(this.props.state.diff)
                }
            </div>) : null) }
          </div>
              }
        </div>
    );
  }

  renderDiff(diffs) {
    const newDiffs = [];
    diffs.forEach((diff) => {
      if (diff.hasOwnProperty('deleted') && diff.hasOwnProperty('added')) {
        this.renderUpdate(newDiffs, diff);
      } else if (diff.hasOwnProperty('deleted')) {
        this.renderDelete(newDiffs, diff);
      } else if (diff.hasOwnProperty('added')) {
        this.renderAdd(newDiffs, diff);
      }
    });

    return newDiffs;
  }

  renderUpdate(diffs, diff) {
    if (typeof diff.deleted == 'object') {
      const keys = this.uniqueMergeArrays(
          Object.keys(diff.deleted),
          Object.keys(diff.added)
      );

      keys.forEach((key) => {
        if (diff.deleted[key] && diff.added[key]) {
          diffs.push(this.renderUpdateAttribute({
            path: diff.path + '.' + key,
            deleted: diff.deleted[key],
            added: diff.added[key]
          }));
        } else if (diff.deleted[key]) {
          diffs.push(this.renderDeleteAttribute({
            path: diff.path + '.' + key,
            deleted: diff.deleted[key]
          }));
        } else {
          diffs.push(this.renderAddAttribute({
            path: diff.path + '.' + key,
            added: diff.added[key]
          }));
        }
      });
    } else {
      diffs.push(this.renderUpdateAttribute(diff));
    }
  }

  renderDelete(diffs, diff) {
    if (typeof diff.deleted == 'object') {
      const keys = Object.keys(diff.deleted);

      keys.forEach((key) => {
        diffs.push(this.renderDeleteAttribute({
          path: diff.path + '.' + key,
          deleted: diff.deleted[key]
        }));
      });
    } else {
      diffs.push(this.renderDeleteAttribute(diff));
    }
  }

  renderAdd(diffs, diff) {
    if (typeof diff.added == 'object') {
      const keys = Object.keys(diff.added);

      keys.forEach((key) => {
        diffs.push(this.renderAddAttribute({
          path: diff.path + '.' + key,
          added: diff.added[key]
        }));
      });
    } else {
      diffs.push(this.renderAddAttribute(diff));
    }
  }

  renderUpdateAttribute(diff) {
    return <span style={styles.path}>{diff.path}:&nbsp;
      <span style={styles.deleted}>{this.renderValue(diff.deleted)}</span>&nbsp;
      <span style={styles.added}>{this.renderValue(diff.added)}</span>
      <br/>
    </span>;
  }

  renderDeleteAttribute(diff) {
    return <span style={styles.path}>{diff.path}:&nbsp;
      <span style={styles.deleted}>{this.renderValue(diff.deleted)}</span>
      <br/>
    </span>;
  }

  renderAddAttribute(diff) {
    return <span style={styles.path}>{diff.path}:&nbsp;
      <span style={styles.added}>{this.renderValue(diff.added)}</span>
      <br/>
    </span>;
  }

  renderValue(value) {
    if (typeof value == 'boolean') {
      return value ? 'true' : 'false';
    } else if (typeof value == 'number') {
      return value;
    } else {
      return '"' + value + '"';
    }
  }

  uniqueMergeArrays(array1, array2) {
    array2.forEach((item) => {
      if (array1.indexOf(item) == -1) {
        array1.push(item);
      }
    });
  }
}

export class DebugPanel extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      states: [],
      mode: DebugMode.STATE,
      currentState: 0
    };

    Store.source.filter(isChangeByOneOfStores([this.props.debugStore]))
        .debounce(100).subscribe((change:StoreChange<DebugHistoryState>) => {
      console.log(change.state.states);
          this.setState({
            states: change.state.states,
            mode: change.state.mode,
            currentState: change.state.currentState
          });
        });
  }

  render() {
    const mode   = this.state.mode;
    const states = this.state.states;

    return (
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <Button
                  style={styles.button}
                  pressed={mode == DebugMode.STATE}
                  onClick={() => this.switchMode(DebugMode.STATE)}>State
              </Button>
              <Button
                  style={styles.button}
                  pressed={mode == DebugMode.FULLSTATE}
                  onClick={() => this.switchMode(DebugMode.FULLSTATE)}>Full-State
              </Button>
              <Button
                  style={styles.button}
                  pressed={mode == DebugMode.DIFF}
                  onClick={() => this.switchMode(DebugMode.DIFF)}>Diff
              </Button>
              <span> #{states.length}</span>
            </div>
            <div>
              <Button
                  style={styles.button}
                  onClick={() => DebugActions.commit()}>Commit
              </Button>
              <Button
                  style={styles.button}
                  onClick={() => DebugActions.sweep()}>Sweep
              </Button>
              <Button
                  style={styles.button}
                  onClick={() => DebugActions.reset()}>Reset
              </Button>
            </div>
          </div>
          <div style={styles.scrollArea}>
            { states.map((state, index) => {
                return (<DebugState currentState={this.state.currentState} index={index} key={state.key}
                                    state={ state } mode={mode}/>);
                }) }
          </div>
          <div style={styles.footer}>
            <TangleText pixelDistance={5}
                        style={styles.slider} onChange={(bounds) => this.onSliderChange(bounds)}
                        value={this.state.currentState} min={0} max={this.state.states.length-1}/>
          </div>
        </div>
    );
  }

  onSliderChange(bounds) {
    DebugActions.jumpToState(this.state.states[bounds]);
  }

  switchMode(mode:DebugMode) {
    DebugActions.setMode(mode);
  }
}

