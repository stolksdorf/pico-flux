const EventEmitter = require('events');

const sameArray = (a, b)=>{
	if(a.length !== b.length) return false;
	return a.every((val, idx)=>val === b[idx]);
};

module.exports = (setters = {}, getters = {}, _opts = {})=>{
	const opts = Object.assign({ event : 'update', cache : false }, _opts);
	let memoize = {};
	const store = {
		emitter : new EventEmitter(),
		emit    : (evt = opts.event)=>store.emitter.emit(evt),
		getter  : (name, func)=>{
			if(!opts.cache) return store[name] = func;
			store[name] = (...args)=>{
				if(memoize[name] && sameArray(memoize[name].args, args)){
					return memoize[name].result;
				}
				const result = func(...args);
				memoize[name] = { args, result };
				return result;
			};
		},
		setter : (name, func)=>{
			store[name] = (...args)=>{
				const result = func(...args);
				if(result !== false){
					memoize = {};
					store.emitter.emit(opts.event);
				}
				return result;
			};
		},
	};
	Object.keys(setters).map((name)=>store.setter(name, setters[name]));
	Object.keys(getters).map((name)=>store.getter(name, getters[name]));
	return store;
};
