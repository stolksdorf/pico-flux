const React = require('react');
const EventEmitter = require('events');

const Flux = {
	actionEmitter : new EventEmitter(),
	dispatch : (actionType, ...args) => {
		Flux.actionEmitter.emit('dispatch', actionType, ...args);
	},
	createStore : (actionListeners) => {
		const store = {
			updateEmitter : new EventEmitter(),
			createSmartComponent : (component, getter) => {
				return React.createClass({
					displayName : `smart${component.displayName || component.name}`,
					getInitialState: function() {
						return getter(Object.assign({}, component.defaultProps, this.props));
					},
					updateHandler : function(){
						this.setState(getter(Object.assign({}, component.defaultProps, this.props, this.state)));
					},
					componentWillMount : function() {
						store.updateEmitter.on('change', this.updateHandler);
					},
					componentWillUnmount : function(){
						store.updateEmitter.removeListener('change', this.updateHandler);
					},
					getRef : function(){
						return this.refs.wrappedComponent;
					},
					render : function(){
						return React.createElement(component, Object.assign({},
							this.props,
							this.state,
							{ref : 'wrappedComponent'}
						));
					}
				});
			},
			emitChange : ()=>{
				store.updateEmitter.emit('change');
			}
		};
		Flux.actionEmitter.on('dispatch', (actionName, ...args)=>{
			if(typeof actionListeners[actionName] === 'function'){
				if(actionListeners[actionName](...args) !== false) store.emitChange();
			}
		});
		return store;
	}
};
module.exports = Flux;