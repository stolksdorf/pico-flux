let test = require('pico-check');
const React        = require('react');
const EventEmitter = require('events');

const TestRenderer = require('react-test-renderer');

const createClass  = require('create-react-class');

const Component = require('../src/component.js');


const wait = (val)=>{
	return new Promise((resolve, reject)=>{setTimeout(()=>resolve(val), 10)});
};
const render = (comp, props, children) =>{
	let tree;
	TestRenderer.act(()=>{
		tree = TestRenderer.create(React.createElement(comp, props, children));
	})
	return tree;
};



test.group('rendering', (test)=>{

	test('renders to a component', (t)=>{
		const result = render(Component({component : 'div'}));
		t.is(result.toJSON().type, 'div');
		t.is(result.toJSON().children, null);
	});

	test('renders to a custom component', (t)=>{
		const custom = createClass({
			displayName: 'Custom',
			render(){
				return React.createElement('span', {}, 'custom');
			}
		});
		const result = render(Component({component: custom}));
		t.is(result.toTree().type.displayName, 'CustomSmart');
		t.is(result.toJSON().type, 'span');
		t.is(result.toJSON().children, ['custom']);
	});
})


test.group('Source Changes', (test)=>{

	test('Updates on source change', async (t)=>{
		let value = "test1";
		const Source = {emitter: new EventEmitter()};
		const noisy = createClass({
			displayName:'Noisy',
			render(){
				return React.createElement('div', null, this.props.children);
			}
		});
		const Smart = Component({
			component : noisy,
			sources : Source,
			getProps : (props)=>{
				return { children : value };
			}
		});

		const result = render(Smart);
		t.is(result.toJSON().children, [value]);

		Source.emitter.emit('update');
		await wait();


		t.is(result.toJSON().children, [value]);

		value = "test2";
		Source.emitter.emit('update');
		await wait();
		t.is(result.toJSON().children, [value]);
	});

	test('Has right number of events on source change', async (t)=>{
		let updateCount = 0, renderCount = 0, value = "test1";
		const Source = {emitter: new EventEmitter()};
		const noisy = createClass({
			displayName:'Noisy',
			render(){
				renderCount++;
				return React.createElement('div', null, this.props.children);
			}
		});
		const Smart = Component({
			component: noisy,
			sources: Source,
			getProps: (props)=>{
				updateCount++;
				return { children : value };
			}
		});

		t.is(updateCount, 0);
		t.is(renderCount, 0);

		const result = render(Smart);
		t.is(updateCount, 1);
		t.is(renderCount, 1);


		Source.emitter.emit('update');
		await wait();

		t.is(updateCount, 2);
		t.is(renderCount, 1);

		value = "test2";
		Source.emitter.emit('update');
		await wait();

		t.is(updateCount, 3);
		t.is(renderCount, 2);
	});
});


test('should call update once on init render', (t)=>{
	let updateCount = 0, renderCount = 0;
	const noisy = createClass({
		displayName:'Noisy',
		render(){
			renderCount++;
			return React.createElement('div', null, this.props.children);
		}
	});
	const Smart = Component({
		component: noisy,
		sources: undefined,
		getProps: ({ value })=>{
			updateCount++;
			return { children : value };
		}
	});
	render(Smart, { value : 3 });
	t.is(renderCount, 1);
	t.is(updateCount, 1);
});

test.group('Prop Change', (test)=>{
	test('Updates on prop change', (t)=>{
		const noisy = createClass({
			displayName:'Noisy',
			render(){
				return React.createElement('div', null, this.props.children);
			}
		});
		const Smart = Component({
			component: noisy,
			sources: undefined,
			getProps: ({ value })=>{
				return { children : value };
			}
		});

		const result = render(Smart, { value : 'test1' });
		t.is(result.toJSON().children, ['test1']);

		result.update(React.createElement(Smart, {value : 'test2'}));
		t.is(result.toJSON().children, ['test2']);
	});

	test('Has right number of calls on prop change', (t)=>{
		let updateCount = 0, renderCount = 0;
		const noisy = createClass({
			displayName:'Noisy',
			render(){
				renderCount++;
				return React.createElement('div', null, this.props.children);
			}
		});
		const Smart = Component({
			component: noisy,
			sources: undefined,
			getProps: ({ value })=>{
				updateCount++;
				return { children : value };
			}
		});

		const result = render(Smart, { value : 'test1' });
		t.is(renderCount, 1);
		t.is(updateCount, 1);

		result.update(React.createElement(Smart, {value : 'test2'}));
		t.is(renderCount, 2);
		t.is(updateCount, 2);

		result.update(React.createElement(Smart, {value : 'test2'}));
		t.is(renderCount, 3);
		t.is(updateCount, 2);
	});
});


test('listens to multiple sources', async (t)=>{
	let updateCount = 0;
	const Source1 = {emitter: new EventEmitter()};
	const Source2 = {emitter: new EventEmitter()};

	const Smart = Component({
		component : 'div',
		sources : [Source1, Source2],
		getProps : (props)=>{
			updateCount++;
			return { children : updateCount};
		}
	});
	render(Smart);

	t.is(updateCount, 1);

	Source1.emitter.emit('update');
	await wait();
	t.is(updateCount, 2);

	Source1.emitter.emit('update');
	await wait();
	t.is(updateCount, 3);

	Source2.emitter.emit('update');
	await wait();
	t.is(updateCount, 4);
});

module.exports = test;