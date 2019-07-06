const React = require('react');

const isDifferent = (a, b)=>{
	if(a === b) return false;
	if(!a || !b) return true;
	for (const i in a)if(!(i in b)) return true;
	for (const i in b)if(a[i] !== b[i]) return true;
	return false;
};

const useIsMounted = ()=>{
	const isMounted = React.useRef(false);
	React.useEffect(()=>isMounted.current = true, []);
	return isMounted.current;
};

const hasPropsChanged = (props)=>{
	const prevProps = React.useRef(props);
	React.useEffect(()=>{
		prevProps.current = props;
	});
	return isDifferent(prevProps.current, props);
};

// const useForceUpdate = ()=>{
// 	const [flag, set] = React.useState(false);
// 	const temp = ()=>set(!flag);
// 	temp.flag = flag;
// 	return temp;
// };


/*
on initial render: getProps
on subsequent re-renders


*/

const useForceUpdate = ()=>React.useState()[1];

const whatever = (preProps, getDerivedProps)=>{
	//const [derviedProps, setDerviedProps] = React.useState(false);
	const forceUpdate = useForceUpdate();

	const lastProps = React.useRef(null);
	const lastState = React.useRef(null);

	const update = ()=>{
		lastProps.current = preProps;
		lastState.current = getDerivedProps(preProps);
	};

	//if(lastState.current === null) update();

	if(isDifferent(lastProps.current, preProps)) update();

	const recompute = ()=>{
		console.log('recomputing');
		const tempState = getDerivedProps(preProps);
		console.log(preProps, tempState);
		if(isDifferent(lastState.current, tempState)){
			lastState.current = tempState;
			forceUpdate();
		}
	};

	return [lastState.current, recompute];
};


const computeProps = (props, getDerivedProps)=>{
	const lastProps = React.useRef(false);
	const [state, set] = React.useState(()=>{
		lastProps.current = props;
		return getDerivedProps(props);
	});
	if(isDifferent(lastProps.current, props)){
		lastProps.current = props;
		set(getDerivedProps(props));
	}
	return [state, ()=>{
		const newState = getDerivedProps(props);
		if(isDifferent(state, newState)) set(newState);
	}];
};

module.exports = (component, _sources = [], getProps = (props)=>props, _opts)=>{
	const opts = Object.assign({ event : 'update' }, _opts);
	const sources = Array.isArray(_sources) ? _sources : [_sources];
	sources.map((source)=>source.usedByComponent = true);

	const Component = (props)=>{

		const [derivedProps, recompute] = computeProps(props, getProps);

		//const isMounted = useIsMounted();
		// const [invalid, doot] = React.useState(false);
		// const invalidate = ()=>doot(!invalid);


		// const memoProps = React.useMemo(()=>{
		// 	console.log('memo hit');
		// 	return getProps(props);
		// }, [props, invalid]);

		//const changed = hasPropsChanged(props);

		//		console.log('memoProps', memoProps);
		//const [storedProps, setStoredProps] = React.useState(getProps(props));
		//const [storedProps, setStoredProps] = React.useState();

		// React.useMemo(()=>{
		// 	console.log('prop cahnge');
		// 	setStoredProps(getProps(props));
		// }, [props]);

		//if(storedProps === false) setStoredProps(getProps(props));

		React.useEffect(()=>{
			// const sourceHandler = ()=>{
			// 	console.log('source handler');
			// 	const newProps = getProps(props);
			// 	if(isDifferent(storedProps, newProps)){
			// 		//invalidate();
			// 		return setStoredProps(newProps);
			// 	}
			// };

			const sourceHandler = recompute;
			sources.map((source)=>source.emitter.on(opts.event, sourceHandler));
			return ()=>sources.map((source)=>source.emitter.removeListener(opts.event, sourceHandler));
		}, [_sources, opts.event]);

		//console.log(storedProps);
		//return React.createElement(component, memoProps);
		//return React.createElement(component, storedProps);
		console.log('re-rendering');
		return React.createElement(component, derivedProps);
	};
	Component.displayName = `${component.displayName}Smart`;
	return Component;
};