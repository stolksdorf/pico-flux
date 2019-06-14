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
- Three major parts: Stores, Contracts, Smart Components
- **Stores**: Syncronous event-y data store for smart components. Has builtin of memoization for incredibly fast re-renders.
- **Contracts**: Asyncronous event-y data store for smart components. Wraps an existing async function and provides methods for tracking in-flight requests, errors, and cached values.
- **Smart Components**: A wrapper around a React component that responds to events from Stores and Contracts intelligently to re-render. Decoupling your data storage layer from your interfaces.


### Example

```jsx

//TODO: Make one big example here


```




# API

## Store
A Store is an event-emitting data structure to store your app's syncronhous data. You can read more in-depth about them [here](https://facebook.github.io/flux/docs/in-depth-overview.html#stores). Stores have `getters` and `setters` that are function defined on initialization. `getters` extract out values from the store (can also do calculated values as well). `setters` update the Store's internal data, while emitting out update events.



#### `Store([setters], [getters]) -> store instance`
Creates a new Store instance. You can optionally pass in your getters and setters on initialization.

```js
const Store = require('pico-flux/store');

let State = { players : [] };

module.exports = Store({
    setPlayers : (players)=>{
        State.players = players;
    }
}, {
    getPlayers : ()=>{
        return State.players
    }
});
```


#### `store.getter([name], [function])`
Creates new `getter` onto the store. In `pico-flux`, `getter` are memoized-once allowing multiple calls with the same parameters back-to-back to be resolved instantly. Whenever a `setter` is called, the memoziation for the store will be cleard.

```js
Store.getter('getActivePlayers' ()=>State.players.filter((player)=>!!player.isActive))
Store.getter('getWinningPlayer', ()=>{
    return Store.getActivePlayers().reduce((winner, player)=>{
        if(!winner) return player;
        if(winner.score < player.score) return player;
        return winner;
    }, false);
});

Store.getWinningPlayer(); //You
```

In this example, multiple calls to `getActivePlayers()` and `getWinningPlayer()` will be memozied, allowing us to write straight forward code, while still being performat even if many components are calling these functions.


#### `store.setter([name], [function])`
Creates new `setter` onto the store. The `setter` should update values in the Store's state. Will always emit an `update` event unless the `setter` returns an explicit `false`. This is used when the you know that the setter isn't actually changing data in the state. Use this sparringly as it can lead to non-updating code.

```js

Store.setter('addNewPlayer', (name, team)=>{
    State.players.push({name, team, score : 0});
})
Store.setter('removePlayer', (name)=>{
    const idx = State.players.findIndex((ply)=>ply.name==name);
    if(idx == -1) return false;
    State.players.splice(idx, 1);
})

Store.addNewPlayer('You', '#BestTeam');
```

In this example, we don't want an update to fire when we can't find the player to remove, so we return `false`.



#### `store.emit(eventName)`
Manually emits an event. This can be useful in niche situations where there are components that only want to listen to specific type of update. This is quite rare and can usually be solved by just using multiple stores.

#### `store.emitter`
Access to the store's [Event Emitter](https://nodejs.org/api/events.html#events_class_eventemitter). Rarely needed.










## Contract
A Contract is a long-lived wrapper around an async function. It tracks error and pending states, and will also cache previously called executions. They also ensure that only one request of the async function will be in-flight at a time, even if multiple calls are made. Whenever the state of a contract changes it has a built-in event emitter to emit change notifications. Contracts share the exact same event signature with [Stores](#stores) so they can both be used with [Components](#Components). Contracts are useful when you have mutilple parts of your application that all rely on a single async source.

- Event
- Memoized
-


#### `Contract(async fn, options) -> contract instance`
Creates a new contract wrapping the passed in async function.

##### options
- `event: 'update'` - Change the name of the event
- `clientOnly: false` - Will only execute the async function if it's on the client. Automatically set to `true` if the contract is used as a source for a smart component.

```js
const UserContract = Contract(async (userId)=>{
    return request.get(`/api/user/${userId}`)
        .then((response)=>response.body.user)
});

//TODO: Add in DB example
const PostsContract = Contract(async (postQuery)=>{
    return await postDatabase.lookup(postQuery);
});

UserContract('abc123').get();
UserContract.emitter.on('update', ()=>{...});
```




#### `contract.emitter`
Access to the contract's [Event Emitter](https://nodejs.org/api/events.html#events_class_eventemitter)

#### `contract.clear()`
Clears out the contract's internal cache of values, pending/error states, and deferred promises for all instances. Does not emit any events.


#### `contract(...args) -> instance`
Returns an instance of the contract coupled to the provided `args`. Calling this with the same `args` will return the same instance. Each instance will have it's own set of value cache, pending state, and errors. The provied `args` will be passed to the contract's async function whenever it's called.

#### `async contract(...args).execute() -> promise`
Executes the `async fn` with the `args`. This puts several things in motion:
- if there's a request already in-flight, simply returns a new promise coupled with it
- sets the contract instance to pending
- clears the errors
- emits a `execute` and `update` event on the contract instance.
- if successful, caches the returned value, sets pending to false, resolves all promises with the value, and emits `finish`
- if not successful, sets the contract's errors, sets pending to false, rejects all promises and emits `oops`
- And finally emits another `update`

This is useful if you definitely want the async function to run regardless of cached values or error states.


#### `async contract(...args).fetch() -> promise`
If the value is cached returns it as a resolved promise, otherwise runs `contract(...args).execute()` and returns the promise.


#### `contract(...args).get() -> value`
A syncronous call to get the value of a contract. If the value is cached, returns it. If there is no cached value and are no errors, it will return `undefined` and will also run `contract(...args).execute()` behind the scenes.

This is useful for [Components](#Component), that simply want a value _right now_, but also to signal to the contract that it should get a value if it doesn't have one cached.


#### `contract(...args).set(value) -> instance`
Updates the value of the contract's cache manually, will also emit an `update` event. This is useful for initially configuring a contract with known data from another source. A good use case is pre-populating contracts in a isomorphic React app. Send along known data from the server, `set` the contracts before render.


#### `contract(...args).isPending() -> boolean`
Returns `true`/`false` if the contract currently processing the async function.

#### `contract(...args).errors() -> null/Error Obj`
Returns the last error from the async function if it was rejected, `null` if there are no errors currently. This is cleared before any call to the async funcution.

#### `contract(...args).value() -> any`
Returns the value currently cached within the contract instance.
















## Smart Component


#### `Smart(component, sources=[], getProps=(props)=>{}, [options]) -> smartComponent`
Returns a new React component that wraps the passed in `component`. The `props` passed to the `smartComponent` will be used as arguments for `getProps`. The result of `getProps` will be passed as `props` to render the wrapped `component`.

`smartComponent` will attempt to re-render when an `update` event happens from one of the `sources`. The `sources` be can a mix of Stores and/or Contracts. Smart will only update if there are actual changes, it does this by checking the reference of new props and the old props. If you are using data from Stores or Contracts, they will be passed by reference and should limit the amount of re-renders by a fair bit.

This Smart Component helps reduce the logic and code within your more presentational components.

```js
const UserInfoSmart = Smart(UserInfo, [UserContract, Store], ({ userId, ...props })=>{
    const User = UserContract(userId, Store.getLocation());
    return {
        user    : User.get(),
        pending : User.isPending(),
        errors  : User.errors(),
        ...props
    };
});

<UserInfoSmart userId={'abc123'} hidden={false} />
```

In this example the `UserInfoSmart` component will re-render if the User contract changes, if the location form the store changes, or if any of the passed in props (such as `hidden`) change. Also `UserInfo` can now be written in a very straight forward way, assuming it will just get the user object as a prop.