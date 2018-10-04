# API





## Store

#### `Store([setters], [getters]) -> store instance`


#### `store.getters([obj of functions])`


#### `store.setters([obj of functions])`


#### `store.emit(eventName)`



#### `store.emitter`
Access to the store's [Event Emitter](https://nodejs.org/api/events.html#events_class_eventemitter)



## Contract
A Contract is a long-lived wrapper around an async function. It tracks error and pending states, it will also cache previously called instances. They also ensure that only one request of the async function will be in-flight at a time. Whenever the state of a contract changes it has a built-in event emitter to emit change notifications. Contracts are useful when you have mutilple parts of your application that all rely on a single async source.


#### `Contract(async fn) -> contract instance`
Creates a new contract wrapping the passed in async function.

```js
const UserContract = Contract(async (userId)=>{
	return request.get(`/api/user/${userId}`)
		.then((response)=>response.body.user)
});

UserContract('abc123').get();
UserContract.emitter.on('update', ()=>{...});
```


#### `contract.emitter`
Access to the contract's [Event Emitter](https://nodejs.org/api/events.html#events_class_eventemitter)

#### `contract.clear()`
Clears out the contract's internal cache of values, pending/eror states, and deferred promises. Does not emit any events.


#### `contract(...args) -> instance`
Returns an instance of the contract coupled to the provided `args`. Calling this with the same `args` will return the same instance.

#### `async contract(...args).call() -> promise`
Executes the `async fn` with the `args`. This puts several things in motion:
- If there's a request already in-flight, simply returns a new promise coupled with it
- Sets the contract instance to pending
- clears the errors
- emits a `fetch` and `update` event on the contract instance.
- if successful, caches the returned value, sets pending to false, resolves all promises, and emits `finish`
- if not successful, sets the contract's errors, sets pending to false, rejects all promises and emits `oops`
- And finally emits an `update`

This is useful if you definitely want to call the async function regardless of cached values or error states.


#### `async contract(...args).fetch() -> promise`
If the value is cached returns it as a resolved promise, otherwise executes `contract(...args).call()` and returns the promise.


#### `contract(...args).get() -> value`
A syncronous call to get the value of a contract. If the value is cached, returns it. If there is no cached value and are no errors, will also execute a `contract(...args).call()` behind the scenes.

This is useful for [Smart Components](), that simply want a value _right now_, but also to signal to the contract that it should get a value if it doesn't have one cached.


#### `contract(...args).set(value) -> instance`
Updates the value of the contract's cache manually, will also emit an `update` event. This is useful for initially configuring a contract with known data from another source.


#### `contract(...args).isPending() -> boolean`
Returns if the contract currently processing the async function.

#### `contract(...args).errors() -> null/Error`
Returns the last error from the async function if it was rejected, `null` if there are no errors currently. This is cleared before any call to the async funcution.

#### `contract(...args).value() -> any`
Returns the value currently cached within the contract instance.


## Component


#### `Component(reactComponent, sources=[], getProps=()=>{}, [options]) -> component`
Returns a new React component that wraps the passed in `reactComponent`. THe `props` passed to this will be used as arguments for `getProps`. The result of `getProps` will be passed as `props` to render the `reactComponent`.

`component` will attempt to re-render when an `update` event happens from one of the `sources`. The `sources` be can a mix of Stores and/or Contracts. Component will only update if there are actual changes, it does this by checking the reference of new props and the old props. If you are using data from Stores or Contracts, they will be passed by reference and should limit the amount of re-renders by a fair bit.

This Component helps reduce the logic and code within your more presentational components.

```js
const SmartUserInfo = Component(UserInfo, [UserContract], ({ userId, ...props})=>{
	const User = UserContract(userId);
	return {
		user : User.get(),
		pending : User.isPending(),
		errors : User.errors(),
		...props
	};
});


<SmartUserInfo userId={'abc123'} hidden={false} />
```


