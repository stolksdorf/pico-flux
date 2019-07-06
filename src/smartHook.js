const React = require('react');

const isShallowSame = (objA, objB)=>{
	if(objA === objB) return true;
	if(typeof objA !== 'object' || typeof objB !== 'object') return false;
	if(objA === null || objB === null) return false;
	if(Object.keys(objA).length !== Object.keys(objB).length) return false;
	return Object.keys(objA).every((key)=>objB.hasOwnProperty(key) && objA[key] === objB[key]);
};


const useSourceHook = (source, getter, deps = [], opts = { event : 'update' })=>{
	const [state, set] = React.useState(getter);
	const isFirstRender = React.useRef(true);
	React.useMemo(()=>{
		if(!isFirstRender.current){
			set(getter());
		}
	}, deps);
	React.useEffect(()=>{
		isFirstRender.current = false;
		const sourceHandler = ()=>{
			const newState = getter();
			if(newState === false) return;
			if(!isShallowSame(state, newState)) set(newState);
		};
		source.emitter.on(opts.event, sourceHandler);
		return ()=>source.emitter.removeListener(opts.event, sourceHandler);
	}, []);
	return state;
};

module.exports = useSourceHook;
