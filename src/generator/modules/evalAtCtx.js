import lodash from 'lodash';
import randInt from '../../lib/randInt';

// https://stackoverflow.com/questions/8403108/calling-eval-in-particular-context
// https://stackoverflow.com/questions/543533/restricting-eval-to-a-narrow-scope
function evalAtCtx(code, ctx, fullText)
{
	// Ignore the eslint warning about the Function contructor just being eval.
	// Yes eval is 'evil', but this is a controlled usage with pre-approved input.
	/*eslint no-new-func: 0*/
	const context = lodash.assign({}, ctx, {
		randInt: randInt
	});
	try
	{
		return (new Function(`with(this) { return ${code}; }`).call(context));
	}
	catch (e)
	{
		//console.error(`Error parsing "${code}" in text "${fullText}" for context`, lodash.cloneDeep(context), e);
		return undefined;
	}
}

export default function exec(text, context)
{
	return text.replace(/\$\((.*?)\)/g, (match, group) => evalAtCtx(group, context, text));
}