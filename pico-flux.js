const React = require('react');
const createClass = require('create-react-class');
const EventEmitter = require('events');

const Flux = {
	actionEmitter : new EventEmitter(),
	dispatch : function(actionType, args){
		args = [].slice.call(arguments);
		args.unshift('dispatch');
		Flux.actionEmitter.emit.apply(Flux.actionEmitter, args);
	},
	createStore : function(actionListeners){
		const store = {
			updateEmitter : new EventEmitter(),
			createSmartComponent : function(component, getter){
				return createClass({
					displayName : `smart-${component.displayName || component.name || 'Component'}`,
					getInitialState: function(){
						return getter(Object.assign({}, component.defaultProps, this.props));
					},
					updateHandler : function(){
						const newState = getter(Object.assign({}, component.defaultProps, this.props, this.state));
						if(newState !== false) this.setState(newState);
					},
					componentWillMount : function(){
						store.updateEmitter.on('change', this.updateHandler);
					},
					componentWillUnmount : function(){
						store.updateEmitter.removeListener('change', this.updateHandler);
					},
					render : function(){
						return React.createElement(component, Object.assign({},
							this.props,
							this.state
						));
					}
				});
			},
			emitChange : function(){
				store.updateEmitter.emit('change');
			}
		};
		Flux.actionEmitter.on('dispatch', function(actionName, args){
			if(typeof actionListeners[actionName] === 'function'){
				args = [].slice.call(arguments, 1);
				if(actionListeners[actionName].apply(store, args) !== false) store.emitChange();
			}
		});
		return store;
	}
};
module.exports = Flux;
