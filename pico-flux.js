const React        = require('react');
const createClass  = require('create-react-class');
const EventEmitter = require('events');

const Flux = (storeSetters={})=>{
	const store = {
		emitter : new EventEmitter(),
		emit    : (evt='update')=>store.emitter.emit(evt),

		//TODO: remove the `setters` idea
		setters : Object.keys(storeSetters).reduce((acc, key)=>{
			acc[key] = (...args)=>{
				if(storeSetters[key](...args) !== false) store.emit();
			}
			return acc;
		}, {}),
		component : (props = {})=>{
			return React.createElement(Flux.component, { stores : [store], ...props });
		}
	};
	return store;
};

Flux.component = createClass({
	getDefaultProps(){
		return {
			stores    : [],
			event     : 'update',
			getProps  : ()=>{},
			component : React.createElement('div')
		}
	},
	getInitialState(){
		return this.props.getProps();
	},
	updateHandler(){
		const newState = this.props.getProps();
		if(newState !== false) this.setState(newState);
	},
	componentWillMount(){
		this.props.stores.map((store)=>store.emitter.on(this.props.event, this.updateHandler);
	},
	componentWillUnmount(){
		this.props.stores.map((store)=>store.emitter.removeListener(this.props.event, this.updateHandler);
	},
	render(){
		return React.createElement(this.props.component, this.state);
	}
});

module.exports = Flux;