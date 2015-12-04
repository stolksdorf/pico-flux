var events = require('events');
var ActionEmitter = new events.EventEmitter();

module.exports = {
	dispatch : function(type){
		var args = Array.prototype.slice.call(arguments, 1);
		ActionEmitter.emit('dispatch', type, args);
	},
	createStore : function(listeners, methods){
		var StoreEmitter = new events.EventEmitter();
		var storeInstance = Object.assign({}, {
			mixin : function(){
				return {
					componentWillMount : function(){
						if(typeof this.onStoreChange !== 'function') throw "Component does not have 'onStoreChange'. Check " + this.constructor.displayName;
						StoreEmitter.on('change', this.onStoreChange);
					},
					componentWillUnmount : function(){
						StoreEmitter.removeListener('change', this.onStoreChange);
					},
				}
			},
			emitChange : function(){
				StoreEmitter.emit('change');
			}
		}, methods);

		ActionEmitter.on('dispatch', function(actionName, argArray){
			if(typeof listeners[actionName] === 'function'){
				var shouldNotEmit = listeners[actionName].apply(storeInstance, argArray);
				if(shouldNotEmit !== false) storeInstance.emitChange();
			}
		});
		return storeInstance;
	}
}