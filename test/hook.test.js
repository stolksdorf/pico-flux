const test = require('pico-check');
const React        = require('react');
const EventEmitter = require('events');

const TestRenderer = require('react-test-renderer');


const useSmartHook = require('../src/smartHook.js');


const wait = (val, time = 10)=>{
	return new Promise((resolve, reject)=>{setTimeout(()=>resolve(val), time);});
};
const render = (comp, props, children)=>{
	let tree;
	TestRenderer.act(()=>{
		tree = TestRenderer.create(React.createElement(comp, props, children));
	});
	return tree;
};




test.group('Source Changes', (test)=>{

	test('Updates on source change', async (t)=>{
		let value = 'test1';
		const Source = { emitter : new EventEmitter() };

		const comp = ()=>{
			const content = useSmartHook(Source, ()=>value);
			return React.createElement('div', null, content);
		};


		const result = render(comp);
		t.is(result.toJSON().children, [value]);

		Source.emitter.emit('update');
		await wait();


		t.is(result.toJSON().children, [value]);

		value = 'test2';
		Source.emitter.emit('update');
		await wait();
		t.is(result.toJSON().children, [value]);
	});

	test('Has right number of events on source change', async (t)=>{
		let updateCount = 0, renderCount = 0, value = 'test1';
		const Source = { emitter : new EventEmitter() };

		const comp = ()=>{
			const content = useSmartHook(Source, ()=>{
				updateCount++;
				return value;
			});
			renderCount++;
			return React.createElement('div', null, content);
		};

		t.is(updateCount, 0);
		t.is(renderCount, 0);

		const result = render(comp);
		t.is(updateCount, 1);
		t.is(renderCount, 1);

		Source.emitter.emit('update');
		await wait();

		t.is(updateCount, 2);
		t.is(renderCount, 1);

		value = 'test2';
		Source.emitter.emit('update');
		await wait();

		t.is(updateCount, 3);
		t.is(renderCount, 2);
	});
});



test('should call update once on init render', (t)=>{
	const Source = { emitter : new EventEmitter() };
	let updateCount = 0, renderCount = 0;
	const comp = ({ value })=>{
		const content = useSmartHook(Source, ()=>{
			updateCount++;
			return value;
		});
		renderCount++;
		return React.createElement('div', null, content);
	};

	render(comp, { value : 3 });
	t.is(renderCount, 1);
	t.is(updateCount, 1);
});



test.group('Prop Change', (test)=>{
	test('Updates on prop change', (t)=>{
		const Source = { emitter : new EventEmitter() };

		const comp = ({ value })=>{
			const content = useSmartHook(Source, ()=>value, [value]);
			return React.createElement('div', null, content);
		};

		const result = render(comp, { value : 'test1' });
		t.is(result.toJSON().children, ['test1']);

		const res = result.update(React.createElement(comp, { value : 'test2' }));
		t.is(result.toJSON().children, ['test2']);
	});

	test('Has right number of calls on prop change', (t)=>{

		const Source = { emitter : new EventEmitter() };
		let updateCount = 0, renderCount = 0;
		const comp = ({ value })=>{
			const content = useSmartHook(Source, ()=>{
				updateCount++;
				return value;
			}, [value]);
			renderCount++;
			return React.createElement('div', null, content);
		};

		const result = render(comp, { value : 'test1' });
		t.is(updateCount, 1);
		t.is(renderCount, 1);

		result.update(React.createElement(comp, { value : 'test2' }));
		//t.is(renderCount, 2); //technically should be 3
		t.is(renderCount, 3);
		t.is(updateCount, 2);

		result.update(React.createElement(comp, { value : 'test2' }));
		t.is(renderCount, 4);
		t.is(updateCount, 2);
	});
});


test('listens to multiple sources', async (t)=>{
	const Source1 = { emitter : new EventEmitter() };
	const Source2 = { emitter : new EventEmitter() };
	let updateCount1 = 0, updateCount2 = 0;
	const comp = ({ value })=>{
		const content = useSmartHook(Source1, ()=>{
			updateCount1++;
			return value;
		}, [value]);

		const content2 = useSmartHook(Source2, ()=>{
			updateCount2++;
		});

		return React.createElement('div', null, content);
	};

	render(comp);

	t.is(updateCount1, 1);
	t.is(updateCount2, 1);

	Source1.emitter.emit('update');
	await wait();
	t.is(updateCount1, 2);

	Source1.emitter.emit('update');
	await wait();
	t.is(updateCount1, 3);

	Source2.emitter.emit('update');
	await wait();
	t.is(updateCount2, 2);
});


module.exports = test;