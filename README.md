# pico-flux
An incredibly tiny version of flux. **Under 40 lines of code**.

[![NPM](https://nodei.co/npm/pico-flux.png)](https://nodei.co/npm/pico-flux/)

*Goal* : pico-flux was made to quickly bootstrap your project with a easy to understand and agnostic implementation of Flux.
If you need to make modifications or add features, it's easy to understand what's happening under the hood and make tweaks.
As your project grows, it's easy to swap out to another more full-featured flux implementation.

**Features**

* Central dispatcher
* React component mixin for subscribing to stores
* Simplified and agnostic store management

**Anti-Features** (features removed from the flux spec to simplify)

* Stores don't need to explicitly register with the central dispatcher
* No `.waitFor()` for chaining stores


### Example actions.js
```javascript
var dispatch = require('pico-flux').dispatch;

module.exports = {
	addInc : function(val){
		dispatch('ADD_INC', val || 1);
	},
	setInc : function(newInc){
		dispatch('SET_INC', newInc);
	},
}
```

### Example store.js
```javascript
var flux = require('pico-flux');

var Store = {
	inc : 0
};

module.exports = flux.createStore({
	//Add your action listeners as the first parameter
	ADD_INC : function(val){
		Store.inc += val;
	},

	//If you don't want your action listens to emit a change, return false
	SET_INC : function(inc){
		Store.inc = inc;
		return false;
	},

	//If your action handler is asynchronous, use the this.emitChange() to trigger a store update manually.
	GET_INC : function(){
		var self = this;
		request.get('/api/inc', function(inc){
			Store.inc = inc;
			self.emitChange();
		});
		return false;
	},
},{
	//And your store getters as the second parameter
	getInc : function(){
		return Store.inc;
	},
})

```

### Example component.jsx
```javascript
var React = require('react');
var Store = require('./store.js');
var Actions = require('./actions.js');

module.exports = React.createClass{
	//Will make this component listen for updates from this store and call onStoreChange
	mixins : [Store.mixin()],

	getInitialState : function(){
		return {
			inc : Store.getInc()
		}
	},
	onStoreChange : function(){
		this.setState({
			inc : Store.getInc()
		})
	},
	handleIncClick : function(){
		Actions.addInc();
	},
	render : function(){
		return <div>
			{this.state.inc}
			<button onClick={this.handleIncClick}>Increment</button>
		</div>
	},
}
```
