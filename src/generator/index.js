import { getGroups } from './utils.js';
import parser from './parser';

const schema = require('./schema.json');

function chooseRandomWithWeight(arr, totalWeight)
{
	let rnum = ((Math.random() * totalWeight) + 1) | 0;
	let i = 0;
	while (rnum > 0)
	{
		rnum -= arr[i++].w;
	}
	return arr[i - 1].v;
}

export function generate({
	race,
	subrace,
	sex,
	forcealign,
	hooks,
	occupation,
	classType,
	profession,
	professionTypes,
})
{

	const options = {
		race: 1,
		subrace: 0,
		classorprof: 0,
		occupation1: 0,
		occupation2: 0,
		alignment: 0,
		plothook: 0,
		gender: 0,
	};

	const context = { vars: {} };
	function processGroups(groups)
	{
		let result = "";
		for (const instruction of groups)
		{
			if (typeof instruction === "string")
			{
				console.log('String Instruction', `"${instruction}"`);
				result += String(instruction);
			}
			else if (typeof instruction === "function")
			{
				console.log('Found Instruction', instruction.name);
				const insRes = instruction(context, options);
				if (insRes !== undefined)
				{
					if (Array.isArray(insRes))
					{
						result += String(processGroups(insRes));
					} else
					{
						result += String(insRes);
					}
				}
			}
			else if (Array.isArray(instruction))
			{
				result += String(processGroups(instruction));
			}
		}
		return result;
	}

	function chooseFromArray(arr)
	{
		const totalWeight = arr.reduce(function(w, e)
		{
			return w + (e.w | 0);
		}, 0);
		return chooseRandomWithWeight(arr, totalWeight);
	}

	function processSchema(schemaElement)
	{
		if (typeof schemaElement === "string")
		{
			console.log(schemaElement);
			const groups = getGroups(schemaElement);
			console.log(groups);
			const result = processGroups(groups);
			console.log(result);
			return result;
		}
		else if (Array.isArray(schemaElement))
		{
			const result = processSchema(chooseFromArray(schemaElement));
			return result;
		}
		else
		{
			const result = {};
			for (const name of Object.keys(schemaElement))
			{
				const element = schemaElement[name];
				// need to make a choice based on weight
				result[name] = processSchema(element);
			}
			return result;
		}
	}

  // process inititalisation first, most of the selection is done here
	processGroups(getGroups(schema.options.initialisation));
	
	console.log('Finished initializing context', context);

	const output = processSchema(schema.output);
	console.log('Done creating npc', output, context);

	return schema;
}