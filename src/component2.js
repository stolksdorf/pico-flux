const React        = require('react');
const createClass  = require('create-react-class');

const shallowDiffers = (a, b)=>{
	for(let i in a) if(!(i in b)) return true;
	for(let i in b) if(a[i] !== b[i]) return true;
	return false;
};

/**
Must re-render on emitter AND prop change
Minimize `getProps` calls


**/

const memoize = require('memoize-one');

module.exports = (component, sources=[], getProps=(props)=>props, options)=>{
	if(!Array.isArray(sources)) sources = [sources];
	const opts = Object.assign({ event : 'update' }, options);

	let _getProps = memoize(getProps);

	const Component = createClass({
		displayName : `${component.displayName}Smart`,
		getInitialState(){
			return _getProps(this.props);
		},
		updateHandler(){
			_getProps = memoize(getProps); //clear memoize cache
			const nextState = _getProps(this.props);
			if(shallowDiffers(this.state, nextState)){
				this.setState(nextState);
			}
		},
		componentDidMount(){
			sources.map((source)=>source.emitter.on(opts.event, this.updateHandler));
		},
		componentWillUnmount(){
			sources.map((source)=>source.emitter.removeListener(opts.event, this.updateHandler));
		},
		render(){
			return React.createElement(component, this.state);
		}
	});
	Component.getDerivedStateFromProps = (nextProps, prevState)=>{
		const nextState = _getProps(nextProps);
		console.log(nextState, prevState, shallowDiffers(prevState, nextState));
		if(shallowDiffers(prevState, nextState)) return nextState;
		return null;
	}

	return Component;
};