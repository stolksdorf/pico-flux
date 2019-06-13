const React       = require('react');
//const createClass = require('create-react-class');

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



//TODO: Re-work with React Hooks.
module.exports = ({ component, sources=[], getProps=(props)=>props, options }) => {
	if(!Array.isArray(sources)) sources = [sources];
	sources.map((source) => source.usedByComponent = true);
	const opts = Object.assign({ event : 'update' }, options);


	function useForceUpdate(){
		const [value, set] = React.useState(true); //boolean state
		return () => set(!value); // toggle the state to force render
	}
	function useCacheProps(){
		const cachedProps = React.useRef(memoize(getProps));
		return cachedProps.current;
	}

	const Component = (props)=>{
		const forceUpdate = useForceUpdate();
		const cachedProps = useCacheProps();

		const sourceHandler = ()=>{
			const oldProps   = cachedProps.flush();
			const freshProps = cachedProps.get(props);
			if(isDifferent(freshProps, oldProps)) forceUpdate();
		};
		React.useEffect(()=>{
			sources.map((source) => source.emitter.on(opts.event, sourceHandler));
			return sources.map((source) => source.emitter.removeListener(opts.event, sourceHandler));
		}, [])
		return React.createElement(component, cachedProps.get(props));
	}

	// const Component = createClass({
	// 	displayName : ,
	// 	cachedProps : memoize(getProps),
	// 	sourceHandler(){
	// 		const oldProps   = this.cachedProps.flush();
	// 		const freshProps = this.cachedProps.get(this.props);
	// 		if(isDifferent(freshProps, oldProps)) this.forceUpdate();
	// 	},
	// 	componentDidMount(){
	// 		sources.map((source) => source.emitter.on(opts.event, this.sourceHandler));
	// 	},
	// 	componentWillUnmount(){
	// 		sources.map((source) => source.emitter.removeListener(opts.event, this.sourceHandler));
	// 	},
	// 	render(){
	// 		return React.createElement(component, this.cachedProps.get(this.props));
	// 	},
	// });

	Component.displayName = `${component.displayName}Smart`;
	return Component;
};