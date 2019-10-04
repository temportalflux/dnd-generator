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

// if grouping has periods ('.'), then it definitely relies on another value external to the hierarchy
// (all non-lineage values have at least a category and key, separated by a period)
export const VARIABLE_REGEX = new RegExp(/\$\((.*?)\)/, 'g');

export function inlineEval(text, context)
{
	return text.replace(VARIABLE_REGEX, (match, group) => evalAtCtx(group, context, text));
}