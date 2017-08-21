# pico-flux
An incredibly tiny version of flux. **Under 50 lines of code**.

[![NPM](https://nodei.co/npm/pico-flux.png)](https://nodei.co/npm/pico-flux/)

**Goal** : pico-flux was made to quickly bootstrap your project with a easy to understand and agnostic implementation of Flux.
If you need to make modifications or add features, it's easy to understand what's happening under the hood and make tweaks.
As your project grows, it's easy to swap out to another more full-featured flux implementation.


### install

```
npm install pico-flux
```

### features

- **Under 50 lines of code**
- Central dispatcher
- Use High Order Components to wrap existing "dumb" components to make them responsive to store changes.
- Simplified and agnostic store management

**Anti-Features** (features removed to reduce complexity)

- Stores don't need to explicitly register with the central dispatcher
- No `.waitFor()` for chaining stores


### example actions.js
```js
const dispatch = require('pico-flux').dispatch;

const Actions = {
    inc : (val = 1) => {
        dispatch('ADD_INC', val);
    },
    delayInc : (val = 1, time = 1000) => {
        dispatch('DELAY_INC', val, time);
    },
    setInc : (newInc) => {
        dispatch('SET_INC', newInc);
    },
};

module.exports = Actions;
```

### example store.js
```js
const flux = require('pico-flux');

let State = {
    count : 0
};

const Store = flux.createStore({
    INC : (val) => {
        State.count += val;
    },

    //If you don't want your action listens to emit a change, return false
    SET_INC : (val) => {
        State.count = val;
        return false;
    },

    //If your action handler is asynchronous, use the Store.emitChange() to trigger a store update manually.
    DELAY_INC : (val, time) => {
        setTimeout(()=>{
            State.count += val;
            Store.emitChange();
        }, time);
        return false;
    }
});

//Add getters to your store for your components to get a subset of the store's state
Store.getCount = ()=>State.count;

module.exports = Store;
```

### example dumb component.jsx
```jsx
const React = require('react');
const createClass = require('create-react-class');

const Counter = createClass({
    getDefaultProps: function() {
        return {
            count : 0,
            onClick : ()=>{}
        };
    },
    render: function(){
        return <div className='counter' onClick={this.props.onClick}>
            {this.props.count}
        </div>
    }
});
```

### example smart component.jsx
Only your smart componnt knows about actions and stores.
```jsx
const Store = require('./store.js');
const Actions = require('./actions.js');
const Counter = require('./counter.jsx');

module.exports = Store.createSmartComponent(Counter,
    (props) => {
        //If the count is identical, don't trigger a re-render
        if(props.count === Store.getCount()) return false;

        return {
            count   : Store.getCount(),
            onClick : Actions.inc()
        };
    }
);
```

### api

#### `flux.dispatch(actionName, ...args)`
Dispatches an event to all stores. If the store has a listener set with that `actionName` it will be called with the provided `args`.

#### `flux.createStore({ actionName : listenerFn, ...}) -> store`
Creates a new store object subscribed to the central dispatcher with the provided mapping of listeners. Listener functions, when called, will emit a change event by default. If you do not want the result of a listener to trigger an update, have it return `false`.

#### `flux.actionEmitter`
Access to `pico-flux`s central action dispatcher as an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter).

#### `store.createSmartComponent(reactComponent, propsGetter) -> smartComponent`
Creates a [Higher-Order-Component](https://facebook.github.io/react/docs/higher-order-components.html) wrapping the provided `reactComponent`. This HOC subscribes to the store you used to create it and will update it's internal state whenever the store updates using the `propsGetter` function you passed. The `propsGetter` will be passed the smart component's props as an argument.

If your `propsGetter` returns `false`, it will not trigger a re-render. This is useful for placing logic within your smart component to throttle excessive re-renders from store updates.

#### `store.emitChange()`
Manually triggers a store update. Useful for conditionally updating the store, or async operations.

#### `store.updateEmitter`
Access to the store's update emitter as an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter).

