import lodash from 'lodash';
import randInt from '../../lib/randInt';

// https://stackoverflow.com/questions/8403108/calling-eval-in-particular-context
// https://stackoverflow.com/questions/543533/restricting-eval-to-a-narrow-scope
function evalAtCtx(code, ctx)
{
	const context = lodash.assign({}, ctx, {
		randInt: randInt
	});
	try
	{
		return (new Function(`with(this) { return ${code}; }`).call(context));
	}
	catch (e)
	{
		console.error(e);
		return undefined;
	}
}

export default function exec(text, context)
{
	return text.replace(/\$\((.*?)\)/g, (match, group) => evalAtCtx(group, context));
}