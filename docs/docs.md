



## Saga

Dealing with asyncronous data is _very hard_. Especially when you want to capture all the potential states in frameworks that promote a functional mindset, such as React.

things you want
- Only one in-flight call at a time.
- caching of the last fetched value
- Syncronous way to check if there's a request in-flight


To create a Saga, you define a single async function you want your




## Adv. Techniques

### Sagas with Server-side rendering
Add conditional logic within the async call to check for environment before firing.


### Wrapping multiple sagas

While Sagas give you a lot of power, their signature might not always fit within your application's verbage.

```js




```



## Store
A store is a mechanicism for storing syncronous changing data in your system. It should be easy and fast to extract values out of your store and to change data within your store. Whenever data changes within your store, the store will emit `update` events, so anything else in your system knows to fetch the freshest data.

To build a store you define a series of `setters` and `getters`, which are functions that either update information within your store or extract out information.

### Setters
When a setter is called, after it executes the Store will emit an `update` event, which signals to anything relying on the store that it should probably update itself.

If your setter returns `false`, then the store will not trigger an update. This is useful for very noisy setters, such as getting constant information from a sensor.


### Getters
While getters can just extract slices from your Store's state, they become very useful when they can do some filtering or calculations for your app. That way your components or other logic can simply call `store.getHighestScoringPlayer()` or `store.getTotalScore()`.

These calls might be expensive, but since getters are memoized subsequent calls to them will return instantly. You should not store any calculated values within your Store's state.


```js
let State = {
	players : []
};

const Store = require('pico-flux/store')(
	{
		setPlayers : (playerList)=>State.players = playerList,
		addPlayer : (name, score=0)=>{
			State.players.push({
				id : State.players.length,
				name,
				score,
				isPlaying : true
			})
		},
		removePlayer : (id)=>{
			const player = State.players.find((player)=>player.id == id);
			if(!player) return false;
			player.isPlaying = false;
		}
	},
	{
		getPlayers(){
			return State.players.filter((player)=>player.isPlaying);
		},
		getHighestScoringPlayer(){
			return Store.getPlayers().sort((player)=>player.score)[0];
		},
		getTotalScore(){
			return Store.getPlayers().reduce((sum, player)=>sum+player.score, 0)
		},
	}
);

module.exports = Store;
```

In this example:

- Both `getTotalScore()` and `getHighestScoringPlayer()` both use another `getter`. Since getters are memoized, we should get a performance bump by re-using them internally.
- In `removePlayer` we return `false` if the id provided does not match any player, as we do not want to emit `update` events when we didn't actually change anything.
-




## Actions
While `pico-flux` doesn't provide any function for actions directly, I've found them to be a useful design pattern. Actions are usually project-spanning processes that either invovled several steps, or will effect many parts of your project at once. Examples: logging out, start game, set edit mode, etc.

Actions are functions that emcompass your business logic and use stores, contracts, or other libraries.


```js
const Store = require('./user.store.js');
const Contracts = require('./user.contracts.js');

const Actions = {
	logout : async (){
		const user = Store.getCurrentUser();
		if(!user) throw 'Not logged in';
		await Contracts.logout(user.sessionId).execute();
		cookie.delete('session-cookie');
		Store.setUser(null);
		router.navigate(Routes.login);
	}
};
module.exports = Actions;
```



