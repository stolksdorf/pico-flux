const EventEmitter = require('events');

const sameArray = (a,b)=>{
	if(a.length !== b.length) return false;
	return a.every((val, idx)=>val===b[idx]);
};

module.exports = (setters={}, getters={})=>{
	let memoize = {};
	const store = {
		emitter : new EventEmitter(),
		emit    : (evt='update')=>store.emitter.emit(evt),
		getters: (funcs={})=>{
			Object.keys(funcs).map((name)=>{
				store[name] = (...args)=>{
					if(memoize[name] && sameArray(memoize[name].args, args)) return memoize[name].result;
					const result = funcs[name](...args);
					memoize[name] = {args, result};
					return result;
				}
			});
			return store;
		},
		setters: (funcs={})=>{
			Object.keys(funcs).map((name)=>{
				store[name] = (...args)=>{
					if(funcs[name](...args) !== false){
						memoize = {};
						store.emitter.emit('update');
					}
				}
			});
			return store;
		}
	};
	store.setters(setters);
	store.getters(getters);
	return store;
};
