// based on https://github.com/matthew-andrews/Promise.prototype.finally
(function(){
	if(typeof Promise.prototype['finally'] === 'function') return;

	const globalObject = (typeof global !== 'undefined')
		? global
		: window;

	globalObject.Promise.prototype['finally'] = function (callback){
		return this.then(
			(value)=>this.constructor.resolve(callback()).then(()=>value),
			(reason)=>this.constructor.resolve(callback()).then(()=>{throw reason;})
		);
	};
})();
