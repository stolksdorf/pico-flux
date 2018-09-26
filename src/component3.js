const React        = require('react');
const createClass  = require('create-react-class');

const isDifferent = (a, b)=>{
	for(let i in a) if(!(i in b)) return true;
	for(let i in b) if(a[i] !== b[i]) return true;
	return false;
};


/**
Must re-render on emitter AND prop change
Minimize `getProps` calls


**/

const memoize = require('memoize-one');

// try to re-implement memoize-one with a shallow compare on the single

module.exports = (component, sources=[], _getProps=(props)=>props, options)=>{
	if(!Array.isArray(sources)) sources = [sources];
	const opts = Object.assign({ event : 'update' }, options);

	const Component = createClass({
		displayName : `${component.displayName}Smart`,
		getProps    : memoize(_getProps),
		sourceHandler(){
			console.log(this.props);
			const newGetProps  = memoize(_getProps);

			const freshState = newGetProps(this.props);
			const oldState   = this.getProps(this.props);

			if(isDifferent(freshState, oldState)){
				this.getProps = newGetProps;
				console.log('UPDATING');
				this.forceUpdate();
			}
		},
		componentDidMount(){
			sources.map((source)=>source.emitter.on(opts.event, this.sourceHandler));
		},
		componentWillUnmount(){
			sources.map((source)=>source.emitter.removeListener(opts.event, this.sourceHandler));
		},
		render(){
			return React.createElement(component, this.getProps(this.props));
		}
	});
	return Component;
};