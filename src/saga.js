const EventEmitter = require('events');

/**
	This won't work with smart components
	the event listeners need to be generic per saga, since you register with a
	single saga instance on creation of a smart component
**/

/** TODO:


/** might need a function that tries to use cache,
	otherwise fetches
**/

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