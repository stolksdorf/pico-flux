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




## Smart Components
a good react design pattern is to kepe your components as simple as possible. A smart compont can be used








### features

- **Under 50 lines of code**
- Use High Order Components to wrap existing "dumb" components to make them responsive to store changes.
- Simplified and agnostic store management
- Stores can emit custom signals to trigger updates in specific components.

**Anti-Features** (features removed to reduce complexity)

- Stores don't need to explicitly register with the central dispatcher
- No `.waitFor()` for chaining stores


### How it works
This library creates a data store for your application that will emit update events when data has been updated. You define a series of "actions" and "getters" to update and extract your data in a controlled way.



### api

#### `flux({ setterName : listenerFn, ...}) -> store`
Creates a new store object with it's own event emitter and smart component. The passed in action functions are bound to the `store.setters` object and will automatically emit an `update` event when called unless they return `false`.

#### `<flux.component stores=[] component={} getProps={()=>{}} [event='update'] />`
Creates a [Higher-Order-Component](https://facebook.github.io/react/docs/higher-order-components.html) wrapping the provided `component`. This HOC subscribes to all the stores passed in and will update it's internal state whenever one of the stores emits the `event` using the object returned from the `getProps` function you passed.

If your `getProps` returns `false`, it will not trigger a state update. This is useful for placing logic within your smart component to throttle excessive re-renders from store updates.


#### `store.setters`
Access to the passed in setters functions from creation. These should not be used directly within dumb components, but passed in as props via smart componesnt to fully decouple dumb components from the store. Each action call will automatically fire an `update` event, which by defaults all smart components are listening for. If the action handler specifically returns `false` this event will not be fired. Useful if the action didn't actually change any data.

#### `store.getters`
Direct access to your store's state should be avoided. Instead you should write custom getters they retrieve slices of your state and return this to your code. Any calcualted values from the store should be encapsulated in a getter as well.

#### `<store.component component={} getProps={()=>{}} [event='update'] />`
Creates a `flux.component` but defaults the `stores` prop to the store that's creating it.

#### `store.emit(event='update')`
Manually emits a store event. Useful for conditionally updating the store, async operations, or custom events that specific smart components are listening for.

#### `store.emitter`
Access to the store's update emitter as an [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter).




### example actions.js
```js
const Store = require('./store.js');

const Actions = {
    inc : (val = 1) => {
        Actions.setVal(Store.getVal() + val);
    },
    delayInc : (val = 1, time = 1000) => {
        Store.setters.setPending();
        setTimeout(()=>{
            Actions.inc(va1);
            Store.setters.setPending(false);
        }, time)
    },
    setVal : (newVal) => {
        Store.setters.setVal(newVal);
    },
};

module.exports = Actions;
```

### example store.js
```js
const flux = require('pico-flux');

let State = {
    value : 0,
    pending : false
};

const Store = flux({
    setVal(val){
        State.value = val;
    },
    setPending(state = true){
        State.pending = state;
    }
});

//Add getters to your store for your components to get a subset of the store's state
Store.getValue  = ()=>State.value;
Store.isPending = ()=>State.pending == true;

module.exports = Store;
```

### example dumb component.jsx
```jsx
const React = require('react');
const createClass = require('create-react-class');

const Counter = createClass({
    getDefaultProps(){
        return {
            count : 0,
            onClick : ()=>{}
        };
    },
    render(){
        return <div className='counter' onClick={this.props.onClick}>
            {this.props.count}
        </div>
    }
});
```

### example smart component.jsx
Only your smart componnt knows about actions and stores. You should pass in all references to them as props.

```jsx
const Store = require('./store.js');
const Actions = require('./actions.js');
const Counter = require('./counter.jsx');

module.exports = (props)=>{
    return <Store.component
        component={Counter}
        getProps={()=>{
            return {
                count   : Store.getValue(),
                onClick : Actions.inc
            }
        }}
    />
}
```



## Sagas
A Saga is an event-driven data structure that wraps around a defined async function. It tracks if the function is currently processing, completed, if and errors occured, and even caches previously fetched values.



```jsx
const LogoutSmart = Smart(Logout, LogoutSaga, ()=>{
    return {
        isLoggingOut : LogoutSaga.isPending(),
        errors       : LogoutSaga.errors(),
        onClick      : ()=>LogoutSaga.fetch()
    }
})
```


```
const Smart = require('pico-flux/component');
const Saga = require('pico-flux/saga');

const UserSaga = Saga((userId)=>{
    return request.get(`/api/user/${userId}`)
        .then((res)=>res.body)
});


const UserSmart = Smart(UserView, [UserSaga, Store], ({ userId })=>{
    if(!userId) userId = Store.getCurrentUserId();
    const saga = UserSaga(accountId);

    return {
        pending : saga.isPending(),
        errors  : saga.errors(),
        user    : saga.get()
    }
});

<UserSmart userId='123abc' />
```


Alternitive signature

```
const LogoutSaga = Saga(async (userId)=>request.post(`/logout/${userId}));

const UserLogout = LogoutSaga('scottuserId123');


UserLogout.fetch();
UserLogout.get();
UserLogout.set(true);
UserLogout.isPending();
//...



```


## Cool ideas
- Feed a contract into a store
- Use store + contract together
- Clear contract on timer
- Database vanish
-