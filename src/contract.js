require('promise.prototype.finally').shim();
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
	const contract = (...args)=>{
		const stash = getStash(args);
		const instance = {
			emit : (evt='update')=>contract.emitter.emit(evt),
			execute : async ()=>{
				const promise = new Promise((resolve, reject)=>stash.deferred.push({resolve, reject}));
				if(stash.pending) return promise;

				stash.pending = true;
				stash.errors = undefined;
				contract.emitter.emit('execute');
				contract.emitter.emit('update');

				asyncFunc(...args)
					.then((val)=>{
						stash.value = val;
						stash.pending = false;
						stash.deferred.map((prom)=>prom.resolve(val));
						contract.emitter.emit('finish');
					})
					.catch((err)=>{
						stash.errors = err;
						stash.pending = false;
						stash.deferred.map((prom)=>prom.reject(err));
						contract.emitter.emit('oops');
					})
					.finally(()=>{
						stash.deferred = [];
						contract.emitter.emit('update');
					});
				return promise;
			},
			isPending : ()=>stash.pending,
			errors    : ()=>stash.errors,
			value     : ()=>stash.value,
			set       : (val)=>{
				stash.value = val;
				contract.emitter.emit('update');
				return instance;
			},
			fetch   : async ()=>{
				if(typeof stash.value !== 'undefined') return Promise.resolve(stash.value);
				return instance.execute();
			},
			get : ()=>{
				if(typeof stash.value !== 'undefined') return stash.value;
				if(typeof stash.errors === 'undefined') instance.execute();
			},
		};
		return instance;
	};
	contract.emitter = new EventEmitter();
	contract.clear = ()=>cache={};
	return contract;
};