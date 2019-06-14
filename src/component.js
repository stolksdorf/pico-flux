const React       = require('react');

const isDifferent = (a, b) => {
	for (const i in a)if(!(i in b)) return true;
	for (const i in b)if(a[i] !== b[i]) return true;
	return false;
};

const memoize = (func) => {
	let lastArg, lastResult, cached = false;
	return {
		get(props){
			if(cached && !isDifferent(props, lastArg)) return lastResult;
			lastArg = props; cached = true;
			lastResult = func(props);
			return lastResult;
		},
		flush(){
			cached = false;
			return lastResult;
		},
	};
};

function useForceUpdate(){
	const [value, set] = React.useState(true);
	return ()=>set(!value);
}
function useCacheProps(getPropsFn){
	const cachedProps = React.useRef(memoize(getPropsFn));
	return cachedProps.current;
}

module.exports = ({ component, sources=[], getProps=(props)=>props, options }) => {
	if(!Array.isArray(sources)) sources = [sources];
	sources.map((source) => source.usedByComponent = true);
	const opts = Object.assign({ event : 'update' }, options);

	const Component = (props)=>{
		const forceUpdate = useForceUpdate();
		const cachedProps = useCacheProps(getProps);
		const sourceHandler = ()=>{
			const oldProps   = cachedProps.flush();
			const freshProps = cachedProps.get(props);
			if(isDifferent(freshProps, oldProps)) forceUpdate();
		};
		React.useEffect(()=>{
			sources.map((source)=>source.emitter.on(opts.event, sourceHandler))
			return ()=>sources.map((source)=>source.emitter.removeListener(opts.event, sourceHandler))
		}, [sources])
		return React.createElement(component, cachedProps.get(props));
	}
	Component.displayName = `${component.displayName}Smart`;
	return Component;
};