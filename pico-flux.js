var React = require('react');
var EventEmitter = require('events');

var Flux = {
	actionEmitter : new EventEmitter(),
	dispatch : function(actionType, args){
		args = [].slice.call(arguments);
		args.unshift('dispatch');
		Flux.actionEmitter.emit.apply(Flux.actionEmitter, args);
	},
	createStore : function(actionListeners){
		var store = {
			updateEmitter : new EventEmitter(),
			createSmartComponent : function(component, getter){
				return React.createClass({
					displayName : `smart${component.displayName || component.name}`,
					getInitialState: function(){
						return getter(Object.assign({}, component.defaultProps, this.props));
					},
					updateHandler : function(){
						this.setState(getter(Object.assign({}, component.defaultProps, this.props, this.state)));
					},
					componentWillMount : function(){
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