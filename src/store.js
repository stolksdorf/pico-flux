const EventEmitter = require('events');

const sameArray = (a,b)=>{
	if(a.length !== b.length) return false;
	return a.every((val, idx)=>val===b[idx]);
};

module.exports = (setters={}, getters={})=>{
	let memoize = {}
	const store = {
		emitter : new EventEmitter(),
		emit    : (evt='update')=>store.emitter.emit(evt),
		addGet : (name, func)=>{
			store[name] = (...args)=>{
				if(memoize[name] && sameArray(memoize[name][0], args)) return memoize[name][1];
				const val = func(...args);
				memoize[name] = [args, val];
				return val;
			}
		},
		addSet : (name, func)=>{
			store[name] = (...args)=>{
				if(func(...args) !== false){
					memoize = {};
					store.emitter.emit('update');
				}
			}
		},
		//getters : ()
	};
	Object.keys(setters).reduce((acc, name)=>store.set(name, setters[name]));
	Object.keys(getters).reduce((acc, name)=>store.get(name, getters[name]));
	return store;
};
