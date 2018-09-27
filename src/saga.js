const EventEmitter = require('events');

module.exports = (asyncFunc, options={})=>{
	let cache = {};
	const getStash = (args)=>{
		const key = JSON.stringify(args);
		if(!cache[key]){
			cache[key] = {
				deferred : [],
				pending  : false,
				errors   : undefined,
				value    : undefined,
			}
		}
		return cache[key];
	};
	const saga = (...args)=>{
		const stash = getStash(args);
		const instance = {
			emit    : (evt='update')=>saga.emitter.emit(evt),
			fetch   : async ()=>{
				const promise = new Promise((resolve, reject)=>stash.deferred.push({resolve, reject}));
				if(stash.pending) return promise;

				stash.pending = true;
				stash.errors = undefined;
				saga.emitter.emit('fetch');
				saga.emitter.emit('update');

				asyncFunc(...args)
					.then((val)=>{
						stash.value = val;
						stash.pending = false;
						stash.deferred.map((prom)=>prom.resolve(val));
						saga.emitter.emit('finish');
					})
					.catch((err)=>{
						stash.errors = err;
						stash.pending = false;
						stash.deferred.map((prom)=>prom.reject(err));
						saga.emitter.emit('error');
					})
					.finally(()=>{
						stash.deferred = [];
						saga.emitter.emit('update');
					});
				return promise;
			},
			isPending : ()=>stash.pending,
			errors    : ()=>stash.errors,
			value     : ()=>stash.value,
			set       : (val)=>{
				stash.value = val;
				saga.emitter.emit('update');
			},
			get : ()=>{
				if(typeof stash.value !== 'undefined') return stash.value;
				if(typeof stash.errors === 'undefined') instance.fetch();
			},
		};
		return instance;
	};
	saga.emitter = new EventEmitter();
	return saga;
};