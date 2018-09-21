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
	const saga = {
		emitter : new EventEmitter(),
		emit    : (evt='update')=>saga.emitter.emit(evt),
		fetch   : async (...args)=>{
			const stash = getStash(args);

			let deferred = {};
			const promise = new Promise((resolve, reject)=>{ deferred = {resolve, reject} });
			stash.deferred.push(deferred);
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
		isPending : (...args)=>getStash(args).pending,
		errors    : (...args)=>getStash(args).errors,
		value     : (...args)=>getStash(args).value,
		set       : (...args)=>{
			const stash = getStash(args);
			return (val)=>{
				stash.value = val;
				saga.emitter.emit('update');
			};
		},
		get : (...args)=>{
			const stash = getStash(args);
			if(typeof stash.value !== 'undefined') return stash.value
			if(typeof stash.errors === 'undefined') saga.fetch(...args);
		},
	};
	return saga;
};