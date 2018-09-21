const EventEmitter = require('events');

module.exports = (storeSetters={})=>{
	const store = {
		emitter : new EventEmitter(),
		emit    : (evt='update')=>store.emitter.emit(evt),

		//TODO: remove the `setters` idea
		setters : Object.keys(storeSetters).reduce((acc, key)=>{
			acc[key] = (...args)=>{
				if(storeSetters[key](...args) !== false) store.emit();
			}
			return acc;
		}, {}),
	};
	return store;
};
