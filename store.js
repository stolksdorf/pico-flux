const EventEmitter = require('events');

const sameArray = (a, b) => {
	if(a.length !== b.length) return false;
	return a.every((val, idx) => val === b[idx]);
};

module.exports = (setters = {}, getters = {}) => {
	let memoize = {};
	const store = {
		emitter : new EventEmitter(),
		emit    : (evt = 'update') => store.emitter.emit(evt),
		getter  : (name, func) => {
			store[name] = (...args) => {
				if(memoize[name] && sameArray(memoize[name].args, args)) return memoize[name].result;
				const result = func(...args);
				memoize[name] = { args, result };
				return result;
			};
		},
		setter : (name, func) => {
			store[name] = (...args) => {
				if(func(...args) !== false){
					memoize = {};
					store.emitter.emit('update');
				}
			};
			return store;
		},
	};
	Object.keys(setters).map((name) => store.setter(name, setters[name]));
	Object.keys(getters).map((name) => store.getter(name, getters[name]));
	return store;
};
