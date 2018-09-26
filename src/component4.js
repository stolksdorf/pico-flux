const React        = require('react');
const createClass  = require('create-react-class');

//Assumes same structure call to call
// const isDifferent3 = (a, b)=>{
// 	for(let i in b) if(a[i] !== b[i]) return true;
// 	return false;
// };

// const isDifferent2 = (a, b)=>{
// 	const keysA = Object.keys(a);
// 	const keysB = Object.keys(b);
// 	if(keysA.length !== keysB.length) return true;
// 	return keysA.every((key)=>a[key]===b[key]);
// };

const isDifferent = (a, b)=>{
	for(let i in a) if(!(i in b)) return true;
	for(let i in b) if(a[i] !== b[i]) return true;
	return false;
};

const memoize = (func)=>{
	let lastArg, lastResult, cached=false;
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
		}
	}
};

module.exports = (component, sources=[], getProps=(props)=>props, options)=>{
	if(!Array.isArray(sources)) sources = [sources];
	const opts = Object.assign({ event : 'update' }, options);

	const Component = createClass({
		displayName : `${component.displayName}Smart`,
		cachedProps : memoize(getProps),
		sourceHandler(){
			const oldProps   = this.cachedProps.flush();
			const freshProps = this.cachedProps.get(this.props);
			if(isDifferent(freshProps, oldProps)) this.forceUpdate();
		},
		componentDidMount(){
			sources.map((source)=>source.emitter.on(opts.event, this.sourceHandler));
		},
		componentWillUnmount(){
			sources.map((source)=>source.emitter.removeListener(opts.event, this.sourceHandler));
		},
		render(){
			return React.createElement(component, this.cachedProps.get(this.props));
		}
	});
	return Component;
};