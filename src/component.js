const React        = require('react');
const createClass  = require('create-react-class');

const shallowDiffers = (a, b)=>{
	for(let i in a) if(!(i in b)) return true;
	for(let i in b) if(a[i] !== b[i]) return true;
	return false;
};

module.exports = (component, sources=[], getProps=(props)=>props, options)=>{
	if(!Array.isArray(sources)) sources = [sources];
	const opts = Object.assign({ event : 'update' }, options);

	const temp =  createClass({
		displayName : `${component.displayName}Smart`,
		getInitialState(){
			return {}//getProps(this.props);
		},
		updateHandler(){
			//this.forceUpdate();
			const nextState = getProps(this.props);
			if(shallowDiffers(this.state, nextState)) this.setState(nextState);
		},
		componentDidMount(){
			sources.map((source)=>source.emitter.on(opts.event, this.updateHandler));
		},
		componentWillUnmount(){
			sources.map((source)=>source.emitter.removeListener(opts.event, this.updateHandler));
		},
		render(){
			console.log("RENDERINGs");
			return React.createElement(component, this.state);
		}
	});

	temp.getDerivedStateFromProps = (props, state)=>{
		console.log('props', props);
		const nextState = getProps(props);
		console.log(nextState, state, shallowDiffers(state, nextState));
		if(shallowDiffers(state, nextState)) return nextState;
		return null;
	};

	return temp;
};