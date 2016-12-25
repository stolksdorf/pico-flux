# pico-flux
An incredibly tiny version of flux. **Under 50 lines of code**.

[![NPM](https://nodei.co/npm/pico-flux.png)](https://nodei.co/npm/pico-flux/)

*Goal* : pico-flux was made to quickly bootstrap your project with a easy to understand and agnostic implementation of Flux.
If you need to make modifications or add features, it's easy to understand what's happening under the hood and make tweaks.
As your project grows, it's easy to swap out to another more full-featured flux implementation.


### install

```
npm install --save pico-flux
```

### features

- **Under 50 lines of code**
- Central dispatcher
- High Order Componenet to wrap existing componenets to make them responsives to store changes.
- Simplified and agnostic store management

**Anti-Features** (features removed to reduce complexity)

- Stores don't need to explicitly register with the central dispatcher
- No `.waitFor()` for chaining stores


### example actions.js
```javascript
const dispatch = require('pico-flux').dispatch;

const Actions = {
    addInc : (val = 1) => {
        dispatch('ADD_INC', val);
    },
    delayInc : (val = 1) => {
        dispatch('DELAY_INC', val)
    },
    setInc : (newInc) => {
        dispatch('SET_INC', newInc);
    },
};

module.exports = Actions;
```

### example store.js
```javascript
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
    DELAY_INC : (val) => {
        setTimeout(()=>{
            State.count += val;
            Store.emitChange();
        }, 2000);
        return false;
    }
});

Store.getCount = ()=>{
    return State.count;
};

module.exports = Store;
```

### example component.jsx
```javascript
const React = require('react');

const Store = require('./store.js');
const Actions = require('./actions.js');

const Counter = React.createClass({
    getDefaultProps: function() {
        return {
            count : 0,
            offset : 0
        };
    },
    handleClick : function(){
        Actions.inc();
    },
    render: function(){
        return <div className='counter' onClick={this.handleClick}>
            {this.props.count + this.props.offset}
        </div>
    }
});

module.exports = Store.createSmartComponent(Counter,
    (props) => {
        return {count : Store.getCount()};
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

#### `store.createSmartComponent(reactComponent, propsGetter) -> component`
Creates a [Higher-Order-Component](https://facebook.github.io/react/blog/2016/07/13/mixins-considered-harmful.html#higher-order-components-explained) wrapping the provided `reactComponent`. This HOC subscribes to the store you used to create it and will update it's internal state whenever the store updates.

It calls the `propsGetter` function to determine what it's state should be, then passes this state and any props passed into it as props down to the wrapped component. The `propsGetter` will be passed the current props as it's only arguement.

#### `store.emitChange()`
Manually triggers a store update. Useful for conditionally updating the store, or async operations.

#### `store.updateEmitter`
Access to the store's update emitter as an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter).




