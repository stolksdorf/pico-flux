const React        = require('react');
const createClass  = require('create-react-class');
const EventEmitter = require('events');

const Flux = (storeSetters={})=>{
	const store = {
		emitter : new EventEmitter(),
		emit    : (evt='update')=>store.emitter.emit(evt),
		set     : Object.keys(storeSetters).reduce((acc, fn, key)=>{
			acc[key] = (...args)=>{
				if(fn(...args) !== false) store.emit();
			}
			return acc;
		}, {}),
		component : createClass({
			getDefaultProps(){
				return {
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
				store.emitter.on(this.props.event, this.updateHandler);
			},
			componentWillUnmount(){
				store.emitter.removeListener(this.props.event, this.updateHandler);
			},
			render(){
				return React.createElement(component, this.state);
			}
		})
	};
	return store;
};
module.exports = Flux;