import React from 'react'
import { Grid } from 'semantic-ui-react';
import FilterMenu from '../components/FilterMenu';
import DisplayNpc from '../components/DisplayNpc';
import { generate } from '../generator/index';
import NpcDataTree from '../components/NpcDataTree';

const TEMP_NPC_DATA = {
	"meta": {
		"stats": {
			"abilityScores": {
				"stringify": "STR($(strength)) DEX($(dexterity)) CON($(constitution)) INT($(intelligence)) WIS($(wisdom)) CHA($(charisma))"
			},
			"alignmentTendancies": {
				"stringify": "$(ethical.positive)/$(ethical.neutral)/$(ethical.negative) - $(moral.positive)/$(moral.neutral)/$(moral.negative)",
				"ethical": {
					"stringify": "$(positive)/$(neutral)/$(negative)"
				},
				"moral": {
					"stringify": "$(positive)/$(neutral)/$(negative)"
				}
			}
		},
		"identity": {
			"name": {},
			"pronouns": {
				"stringify": "$(singular)/$(thirdPerson)/$(possessive)",
				"singular": {
					"canReroll": false
				},
				"thirdPerson": {
					"canReroll": false
				},
				"possessive": {
					"canReroll": false
				}
			}
		},
		"description": {
			"face": {
				"attractiveness": {}
			},
			"hair": {},
			"beard": {}
		},
		"personality": {}
	},
	"values": {
		"stats": {
			"abilityScores": {
				"strength": 9, "dexterity": 9, "constitution": 9, "intelligence": 9, "wisdom": 9, "charisma": 9
			},
			"alignmentTendancies": {
				"ethical": { "positive": 5, "neutral": 2, "negative": 1 },
				"moral": { "positive": 3, "neutral": 9, "negative": 3 }
			}
		},
		"identity": {
			"name": ["Jim", "Bob", "the third"],
			"pronouns": { "singular": "they", "thirdPerson": "them", "possessive": "their" },
			"genderIdentity": "man",
			"genderExpression": "nonbinary",
			"sex": "male",
			"sexualOrientation": "straight"
		},
		"description": {
			"age": 34,
			"height": 176,
			"weight": 184,
			"race": "human",
			"subrace": undefined,
			"skin": "white",
			"eyeColor": "green",
			"face": {
				"shape": "triangular",
				"attractiveness": {
					"modifier": "incredibly",
					"quality": "common"
				}
			},
			"hair": {
				"type": "normal",
				"length": "cropped",
				"style": "wavy",
				"color": "dyed blue"
			},
			"beard": {
				"length": "gigantic, braided",
				"shape": "squared beard"
			}
		},
		"personality": {
			"alignmentMoral": "good",
			"deity": "Tyr, God of justice (Lawful Good)"
		}
	}
};

export default class Home extends React.Component
{

	constructor(props)
	{
		super(props);
		this.generate = this.generate.bind(this);
		this.onRerollClicked = this.onRerollClicked.bind(this);

		this.state = {
			npc: undefined
		};
	}

	generate(filter)
	{
		console.log(generate);
		const data = generate(filter);
		console.log(data);
		this.setState({
			npc: data
		});
	}

	onRerollClicked(evt, { path })
	{
		console.log('TODO Reroll', path);
	}

	render()
	{
		return (
			<div>
				<Grid columns={2}>
					<Grid.Row>
						<Grid.Column>
							<FilterMenu
								generate={this.generate}
							/>
						</Grid.Column>
						<Grid.Column>
							<DisplayNpc
								data={this.state.npc}
							/>
						</Grid.Column>
					</Grid.Row>
				</Grid>

				<NpcDataTree
					data={TEMP_NPC_DATA}
					onRerollClicked={this.onRerollClicked}
				/>

			</div>
		);
	}

}
