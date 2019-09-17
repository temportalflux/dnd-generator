
/*
All supported operations
{%v1=%v2} : v1 = v2
{%v1=15} : v1 = 15
{%v1+%v2} : v1 = v1 + v2
{%v1+15} : v1 = v1 + 15
{%v1-%v2} : v1 = v1 - v2
{%v1-15} : v1 = v1 - 15
{%v1} : output v1
{$s1=$s2} : s1 = s2
{$s1=du text lala.} : s1 = txt
{$s1+$s2} : s1 = s1 + s2
{$s1+du text lala.} : s1 = s1 + txt
{$s1} : output s1
{\n} : output an endline
*/
export const operators = [
	// {%v1=%v2}
	{
		regex: /^{%(.+)=%(.*)}/,
		makeOperator: (m) =>
		{
			const v1 = m[1], v2 = m[2];
			return function setToVar(context)
			{
				context.vars[v1] = context.vars[v2];
			};
		},
		analysis: m => ({
			def: [new s.NumberDef(m[1])],
			use: [new s.NumberUse(m[2])]
		})
	},
	// {%v1=15}
	{
		regex: /^{%(.+)=(.*)}/,
		makeOperator: (m) =>
		{
			const v1 = m[1], value = +m[2];
			return function setToConst(context)
			{
				context.vars[v1] = value;
			};
		},
		analysis: m => ({
			def: [new s.NumberDef(m[1])]
		})
	},
	// {%v1+%v2}
	{
		regex: /^{%(.+)\+%(.*)}/,
		makeOperator: (m) =>
		{
			const v1 = m[1], v2 = m[2];
			return function plusEqualsVar(context)
			{
				context.vars[v1] = (+context.vars[v1]) + (+context.vars[v2]);
			};
		},
		analysis: m => ({
			def: [new s.NumberDef(m[1])],
			use: [new s.NumberUse(m[1]), new s.NumberUse(m[2])]
		})
	},
	// {%v1+15}
	{
		regex: /^{%(.+)\+(.*)}/,
		makeOperator: (m) =>
		{
			const v1 = m[1], value = +m[2];
			return function plusEqualsConst(context)
			{
				context.vars[v1] = (+context.vars[v1]) + value;
			};
		},
		analysis: m => ({
			def: [new s.NumberDef(m[1])],
			use: [new s.NumberUse(m[1])]
		})
	},
	// {%v1-%v2}
	{
		regex: /^{%(.+)-%(.*)}/,
		makeOperator: (m) =>
		{
			const v1 = m[1], v2 = m[2];
			return function minusEqualsVar(context)
			{
				context.vars[v1] = (+context.vars[v1]) - (+context.vars[v2]);
			};
		},
		analysis: m => ({
			def: [new s.NumberDef(m[1])],
			use: [new s.NumberUse(m[1]), new s.NumberUse(m[2])]
		})
	},
	// {%v1-15}
	{
		regex: /^{%(.+)-(.*)}/,
		makeOperator: (m) =>
		{
			const v1 = m[1], value = +m[2];
			return function minusEqualsConst(context)
			{
				context.vars[v1] = (+context.vars[v1]) - value;
			};
		},
		analysis: m => ({
			def: [new s.NumberDef(m[1])],
			use: [new s.NumberUse(m[1])]
		})
	},
	// {%v1}
	{
		regex: /^{%(.+)}/,
		makeOperator: (m) =>
		{
			const v1 = m[1];
			return function outputVar(context)
			{
				return (+context.vars[v1]) | 0;
			};
		},
		analysis: m => ({
			use: [new s.NumberUse(m[1])]
		})
	},
	// {$s1=$s2}
	{
		regex: /^{\$(.+)=\$(.*)}/,
		makeOperator: (m) =>
		{
			const s1 = m[1], s2 = m[2];
			return function setStringVar(context)
			{
				context.vars[s1] = String(context.vars[s2]);
			};
		},
		analysis: m => ({
			def: [new s.StringDef(m[1])],
			use: [new s.StringUse(m[2])]
		})
	},
	// {$s1=du text lala.}
	{
		regex: /^{\$(.+)=(.*)}/,
		makeOperator: (m) =>
		{
			const s1 = m[1], text = m[2];
			return function setStringConst(context)
			{
				context.vars[s1] = text;
			};
		},
		analysis: m => ({
			def: [new s.StringDef(m[1])],
		})
	},
	// {$s1+$s2}
	{
		regex: /^{\$(.+)\+\$(.*)}/,
		makeOperator: (m) =>
		{
			const s1 = m[1], s2 = m[2];
			return function concatStringVar(context)
			{
				context.vars[s1] += String(context.vars[s2]);
			};
		},
		analysis: m => ({
			def: [new s.StringDef(m[1])],
			use: [new s.StringUse(m[1]), new s.StringUse(m[2])]
		})
	},
	// {$s1+du text lala.}
	{
		regex: /^{\$(.+)\+(.*)}/,
		makeOperator: (m) =>
		{
			const s1 = m[1], text = m[2];
			return function concatStringConst(context)
			{
				context.vars[s1] += text;
			};
		},
		analysis: m => ({
			def: [new s.StringDef(m[1])],
			use: [new s.StringUse(m[1])]
		})
	},
	// {$s1}
	{
		regex: /^{\$(.+)}/,
		makeOperator: (m) =>
		{
			const s1 = m[1];
			return function outputStringVar(context)
			{
				return context.vars[s1];
			};
		},
		analysis: m => ({
			use: [new s.StringUse(m[1])]
		})
	},
	// {\n}
	{
		regex: /^{\\n}$/,
		makeOperator: (m) =>
		{
			return function outputEndline(context) { return "\n"; }
		},
		analysis: m => ({})
	},
	// {table}
	{
		regex: /^{(.*)}/, makeOperator(m) {
			const tablename = m[1];
			const t = getTable(tablename);
			return function operator(context, options) {
				function chooseOption(index) {
					if ((index >>> 0) >= t.options.length) {
						console.warn("Index [%d] for table [%s]", index, tablename);
						return chooseRandomWithWeight(t.options, t.w);
					}
					/*if(__DEV__) {
						console.log(
							"Table [%s] option forced to [%s]",
							tablename,
							t.options[index].original
						);
					}*/
					return t.options[index].v;
				}

				if (tablename === "race" && isNumber(options.race)) {
					return chooseOption(options.race);
				} else if (tablename === "forcealign" && isNumber(options.alignment)) {
					return chooseOption(options.alignment);
				} else if (tablename === "hooks" && isNumber(options.plothook)) {
					return chooseOption(options.plothook);
				} else if (tablename.match(/gender$/) && isNumber(options.gender)) {
					return chooseOption(options.gender);
				}
				if (isNumber(options.subrace) &&
					(
						tablename === "raceelf" ||
						tablename === "racedwarf" ||
						tablename === "racegnome" ||
						tablename === "racehalfling" ||
						tablename === "racegenasi"
					)
				) {
					return chooseOption(options.subrace);
				}

				if (isNumber(options.classorprof)) {
					if (tablename === "occupation") {
						return chooseOption(options.classorprof);
					} else if (
						isNumber(options.occupation1) &&
						options.classorprof === 0 &&
						tablename === "class"
					) {
						return chooseOption(options.occupation1);
					} else if (
						isNumber(options.occupation1) &&
						options.classorprof === 1 &&
						tablename === "profession"
					) {
						return chooseOption(options.occupation1);
					} else if (
						isNumber(options.occupation1) &&
						isNumber(options.occupation2) &&
						options.classorprof === 1 &&
						(
							tablename === "learned" ||
							tablename === "lesserNobility" ||
							tablename === "professional" ||
							tablename === "workClass" ||
							tablename === "martial" ||
							tablename === "underclass" ||
							tablename === "entertainer"
						)
					) {
						return chooseOption(options.occupation2);
					}
				}
				return chooseRandomWithWeight(t.options, t.w);
			};
		},
		analysis: m => ({
			table: m[1]
		})
	}
];

function mapGroup(g)
{
	//todo: replace escaped \{ and \}
	if (g[0] === "{")
	{
		for (const op of operators)
		{
			const m = g.match(op.regex);
			if (m)
			{
				return op.makeOperator(m);
			}
		}
		return () => { };
	}
	return g;
}

export function getGroups(val)
{
	if (typeof val !== "string" || val.length === 0)
	{
		throw new Error("Empty value to get group");
	}
	val = val.replace("{\\n}", "\n");
	return (val.match(/{((\\{|\\}|[^{}])*)}|((\\{|\\}|[^{}])+)/g) || []).map(g => mapGroup(g));
}
