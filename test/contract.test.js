const test = require('pico-check');
//const test = require('pico-check').only();
const Contract = require('../src/contract.js');

const wait = (val)=>{
	return new Promise((resolve, reject)=>{setTimeout(()=>resolve(val), 20)});
};
const fail = (val)=>{
	return new Promise((resolve, reject)=>{setTimeout(()=>reject(val), 20)});
};


test.group('async func', (test)=>{
	test('can chain thens on function', async (t)=>{
		const contract = Contract((val)=>{
			return wait(val).then((res)=>res*2)
		});
		await contract(6).fetch();
		t.is(contract(6).get(), 12);
	})

	test('can chain catches on function', async (t)=>{
		const contract = Contract((val)=>{
			return fail(val).catch((err)=>{
				throw 'error';
			});
		});
		return contract(6).fetch()
			.then(()=>t.fail())
			.catch((err)=>{
				t.is(err, 'error');
				t.is(contract(6).errors(), 'error');
			})
	})

	test('can catch and swallow errors', async (t)=>{
		const contract = Contract((val)=>{
			return fail(val).catch((err)=>{
				return 'caught';
			});
		});
		await contract(6).fetch()
		t.is(contract(6).get(), 'caught');
		t.is(typeof contract(6).errors(), 'undefined');
	})
})



test.group('get', (test)=>{
	test('first get time will fetch', (t)=>{
		const contract = Contract(wait);
		t.is(typeof contract('first').get(), 'undefined');
		return new Promise((resolve)=>{
			contract.emitter.on('finish', resolve);
		});
	});

	test('get will return a fetched value', async (t)=>{
		const contract = Contract(wait);
		await contract(6).fetch();
		t.is(contract(6).get(), 6);
	});

	test('get will return a set value', (t)=>{
		const contract = Contract(wait);
		contract(6).set('setsetset');
		t.is(contract(6).get(), 'setsetset');
	});
});

test.group('execute', (test)=>{

	test('execute should trigger proper events', async (t)=>{
		let counts = { execute : 0, update : 0, finish : 0, error : 0 };

		const contract = Contract(wait);

		contract.emitter.on('execute', ()=>counts.execute++);
		contract.emitter.on('update', ()=>counts.update++);
		contract.emitter.on('finish', ()=>counts.finish++);
		contract.emitter.on('oops', ()=>counts.error++);

		await contract(true).execute();

		t.is(contract(true).get(), true);
		t.is(counts.execute, 1);
		t.is(counts.update, 2);
		t.is(counts.finish, 1);
		t.is(counts.error, 0);
	});

	test('multiple executees resolve', (t)=>{
		const contract = Contract(wait);
		return Promise.all([contract(6).execute(), contract(6).execute()])
			.then((res)=>{
				t.is(res, [6,6])
			})
	});

	test('multiple executees only execute once per arg set', (t)=>{
		let executeCount = 0;
		const contract = Contract(wait);
		contract.emitter.on('execute', ()=>executeCount++);
		return Promise.all([contract(6).execute(), contract(6).execute(), contract(8).execute()])
			.then((res)=>{
				t.is(res, [6,6,8]);
				t.is(executeCount, 2)
			})
	});
});

test.group('fetch', (test)=>{

	test('fetch will execute', async (t)=>{
		let counts = { execute : 0, update : 0, finish : 0, error : 0 };
		const contract = Contract(wait);

		contract.emitter.on('execute', ()=>counts.execute++);

		t.is(await contract(5).fetch(), 5);
		t.is(counts.execute, 1);
	});


	test('subsequent fetches will not execute', async (t)=>{
		let counts = { execute : 0, update : 0, finish : 0, error : 0 };
		const contract = Contract(wait);

		contract.emitter.on('execute', ()=>counts.execute++);

		t.is(await contract(5).fetch(), 5);
		t.is(await contract(5).fetch(), 5);
		t.is(counts.execute, 1);

	}, { timeout : 30 });

	test('fetch always returns a promise', async (t)=>{
		const contract = Contract(wait);

		t.ok(contract('test').fetch() instanceof Promise);
		t.ok(contract('test').fetch() instanceof Promise);
		await contract('test').fetch();
		t.ok(contract('test').fetch() instanceof Promise);
	});
});




module.exports = test;