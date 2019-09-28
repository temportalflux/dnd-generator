import lodash from 'lodash';

export default function appendModifiers(current, toAppend) {
	return lodash.toPairs(toAppend).reduce((accum, [key, modifier]) => {
		
		if (!accum.hasOwnProperty(key)) accum[key] = [];
		else if (!Array.isArray(accum[key])) accum[key] = [accum[key]];
		
		if (Array.isArray(modifier)) accum[key] = accum[key].concat(modifier);
		else accum[key].push(modifier);

		return accum;
	}, current);
};