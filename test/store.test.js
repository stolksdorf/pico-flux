const test = require('pico-check');
const Store = require('../store.js');

//test = test.only();


test('getting the same value is cached', (t) => {
	let updateCount = 0;
	const store = Store({}, { add : (a, b) => {
		updateCount++;
		return a + b;
	} });

	t.is(store.add(3, 4), 7);
	t.is(updateCount, 1);

	t.is(store.add(3, 4), 7);
	t.is(updateCount, 1);

	t.is(store.add(5, 2), 7);
	t.is(updateCount, 2);
});


test('if a setter is called, memoziation is flushed', (t) => {
	let updateCount = 0, value = 0;
	const store = Store({
		set : (newVal) => value = newVal,
	}, { get : () => {
		updateCount++;
		return value;
	} });

	t.is(store.get(), value);
	t.is(updateCount, 1);

	t.is(store.get(), value);
	t.is(updateCount, 1);

	store.set(4);

	t.is(store.get(), value);
	t.is(updateCount, 2);
	t.is(store.get(), value);
	t.is(updateCount, 2);
});

test('if a setter returns false, no-op', (t) => {
	let updateCount = 0, value = 0;
	const store = Store({
		set : (newVal) => {
			value = newVal;
			return newVal;
		},
	}, { get : () => {
		updateCount++;
		return value;
	} });

	store.get();
	t.is(updateCount, 1);

	store.set(4);

	store.get();
	t.is(updateCount, 2);

	store.set(false);

	store.get();
	t.is(updateCount, 2, 'set(false) is a no-op, so .get() should still be cached');
});

test('update event is emitted when a setter is called', (t) => {
	let updateCount = 0;
	const store = Store({
		set : (newVal) => newVal,
	});

	store.emitter.on('update', () => updateCount++);

	store.set(5);
	t.is(updateCount, 1);

	store.set(5);
	t.is(updateCount, 2);

	store.set(false);
	t.is(updateCount, 2);
});


module.exports = test;