const events = require('events');
const actionEmitter = new events.EventEmitter();

module.exports = {
	dispatch : (actionType, ...args) => {
		actionEmitter.emit('dispatch', actionType, ...args);
	},
	createStore : (listeners) => {
		const storeEmitter = new events.EventEmitter();
		const store = {
			createSmartComponent : (component, getter) => {
				return React.createClass({
					getInitialState: function() {
						return getter(); //Call with scope on component?
					},
					updateHandler : function(){
						this.setState(getter()); //Call with scope on component?
					},
					componentWillMount: function() {
						storeEmitter.on('change', this.updateHandler);
					},
					componentWillUnmount : function(){
						storeEmitter.removeListener('change', this.updateHandler);
					},
					render : function(){
						return React.createElement(component, Object.assign({}, this.props, this.state));
					}
				});
			},
			emitChange : ()=>{
				storeEmitter.emit('change');
			}
		};

		actionEmitter.on('dispatch', (actionName, ...args)=>{
			if(typeof listeners[actionName] === 'function'){
				var shouldNotEmit = listeners[actionName].apply(store, args);
				if(shouldNotEmit !== false) store.emitChange();
			}
		});
		return store;
	}
}