import React from 'react';
import { Header, Button, List, Popup, Table, Grid, Divider } from 'semantic-ui-react';
import copyToClipboard from '../lib/clipboard';
import lodash from 'lodash';

const formatData = (data) => `
<h1>Description</h1>
<ul>
	<li>Test</li>
<ul>
`;

function toFeet(n)
{
	const realFeet = ((n * 0.393700) / 12);
	const feet = Math.floor(realFeet);
	const inches = Math.floor((realFeet - feet) * 12);
	return feet + "'" + inches + '"';
}

export default class DisplayNpc extends React.Component
{

	constructor(props)
	{
		super(props);
		this.exportRef = React.createRef();
	}

	onExport()
	{
		const generator = this.props.generator;
		/*
		copyToClipboard(formatData({
			description: [
				''
			]
		}));
		//*/
		copyToClipboard('<h1>Test</h1>');
	}

	toSentenceCase(sentence)
	{
		return sentence.length <= 0 ? '' : (
			sentence[0].toUpperCase() + sentence.slice(1)
		);
	}

	getRenderedText(text, entry)
	{
		if (typeof text === 'function')
		{
			return text(entry.toString());
		}
		else if (text !== undefined)
		{
			return text;
		}
		else
		{
			return entry.toString();
		}
	}

	createEntryItem(entry, text = undefined, rerollAs = undefined)
	{
		const renderedText = this.getRenderedText(text, entry);
		if (!entry.getCanReroll())
		{
			return renderedText;
		}
		return (
			<Popup
				hoverable={true}
				trigger={(<span style={{
					color: "#4400ff",
					fontWeight: 'bold'
				}}>{renderedText}</span>)}
				content={(
					<span>
						<Button path={rerollAs || entry.getPath()} size='mini' icon='refresh' onClick={this.props.onRerollClicked} />
						<label>{entry.getName()}: {renderedText}</label>
					</span>
				)}
			/>
		);
	}

	render()
	{
		// <Button onClick={this.onExport.bind(this)} />
		const { generator } = this.props;

		console.log(generator, generator.getAllValues());

		const strength = generator.getEntry('stats.abilityScores.strength');
		const dexterity = generator.getEntry('stats.abilityScores.dexterity');
		const constitution = generator.getEntry('stats.abilityScores.constitution');
		const intelligence = generator.getEntry('stats.abilityScores.intelligence');
		const wisdom = generator.getEntry('stats.abilityScores.wisdom');
		const charisma = generator.getEntry('stats.abilityScores.charisma');
		const ethicalPositive = generator.getEntry('stats.alignmentTendancies.ethical.positive');
		const ethicalNeutral = generator.getEntry('stats.alignmentTendancies.ethical.neutral');
		const ethicalNegative = generator.getEntry('stats.alignmentTendancies.ethical.negative');
		const moralPositive = generator.getEntry('stats.alignmentTendancies.moral.positive');
		const moralNeutral = generator.getEntry('stats.alignmentTendancies.moral.neutral');
		const moralNegative = generator.getEntry('stats.alignmentTendancies.moral.negative');

		const name = generator.getEntry('identity.name');
		const surname = generator.getEntry('identity.surname');
		const pronouns = generator.getEntry('identity.pronouns');
		const genderIdentity = generator.getEntry('identity.genderIdentity');
		const genderExpression = generator.getEntry('identity.genderExpression');
		const sex = generator.getEntry('identity.sex');
		const romanticIdentity = generator.getEntry('identity.romanticIdentity');
		const sexualIdentity = generator.getEntry('identity.sexualIdentity');
		const sexualOrientation = generator.getEntry('identity.sexualOrientation');

		const profession = generator.getEntry('occupation.profession');

		const age = generator.getEntry('description.age');
		const eyeColor = generator.getEntry('description.eyeColor');
		const height = generator.getEntry('description.height');
		const weight = generator.getEntry('description.weight');
		const face = generator.getEntry('description.face');
		const race = generator.getEntry('description.race');
		const hair = generator.getEntry('description.race.hair');
		const skin = generator.getEntry('description.race.skin');

		const physicalTraitsMap = generator.getEntry('description.specialPhysical').getChildren();
		const physicalTraits = lodash.values(physicalTraitsMap).map((entry) => (
			<List.Item key={entry.getPath()}>
				{this.createEntryItem(entry, this.toSentenceCase)}
			</List.Item>
		));

		const deity = generator.getEntry('personality.religion.deity');
		const worship = generator.getEntry('personality.religion.worship');
		const quirks = generator.getEntry('personality.quirks');
		const quirkList = quirks.getCollection().map((entry) => (
			<List.Item key={entry.getPath()}>
				{this.createEntryItem(entry, this.toSentenceCase)}
			</List.Item>
		));

		return (
			<div ref={this.exportRef}>

				<Header content='Description' />
				<List bulleted>
					<List.Item>
						{this.createEntryItem(name)}{surname.hasValue() && this.createEntryItem(surname, ` ${surname.toString()}`)}
						&nbsp; is a &nbsp;
						{this.createEntryItem(age)} year old &nbsp;
						{this.createEntryItem(genderIdentity)} &nbsp;
						{this.createEntryItem(race)} &nbsp;
						{this.createEntryItem(profession, undefined, 'occupation.type')}.
					</List.Item>
					<List.Item>
						{this.toSentenceCase(pronouns.getValue().singular)}
						&nbsp; has &nbsp;
						{this.createEntryItem(eyeColor, `${eyeColor.toString()} eyes`)}
						&nbsp; and &nbsp;
						{this.createEntryItem(hair)}.
					</List.Item>
					<List.Item>
						{this.toSentenceCase(pronouns.getValue().singular)}
						&nbsp; has &nbsp;
						{this.createEntryItem(skin)}.
					</List.Item>
					<List.Item>
						{this.toSentenceCase(pronouns.getValue().singular)}
						&nbsp; stands &nbsp;
						{this.createEntryItem(height, `${height.toString()}cm (${toFeet(height.getValue())})`)}
						&nbsp; tall and has a &nbsp;
						{this.createEntryItem(weight)} build.
						</List.Item>
					<List.Item>
						{this.toSentenceCase(pronouns.getValue().singular)}
						&nbsp; has an &nbsp;
						{this.createEntryItem(face)} face.
					</List.Item>
					{physicalTraits}
				</List>

				<Header content='Identity' />
				<Table compact='very' size='small' striped textAlign='center'>
					<Table.Body>
						<Table.Row>
							<Table.Cell>Pronouns</Table.Cell>
							<Table.Cell>{this.createEntryItem(pronouns)}</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>Gender Identity</Table.Cell>
							<Table.Cell>{this.createEntryItem(genderIdentity)}</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>Gender Expression</Table.Cell>
							<Table.Cell>{this.createEntryItem(genderExpression)}</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>Sex</Table.Cell>
							<Table.Cell>{this.createEntryItem(sex)}</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>Romantic Identity</Table.Cell>
							<Table.Cell>{this.createEntryItem(romanticIdentity)}</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>Sexual Identity</Table.Cell>
							<Table.Cell>{this.createEntryItem(sexualIdentity)}</Table.Cell>
						</Table.Row>
						<Table.Row>
							<Table.Cell>Sexual Orientation</Table.Cell>
							<Table.Cell>{this.createEntryItem(sexualOrientation)}</Table.Cell>
						</Table.Row>
					</Table.Body>
				</Table>

				<Header content='Personality' />
				<List bulleted>
					<List.Item>
						{this.toSentenceCase(pronouns.getValue().singular)}
						&nbsp; {this.createEntryItem(worship)} worships {this.createEntryItem(deity)}.
					</List.Item>
					{quirkList}
				</List>

				<Header content='Stats' />
				<Grid columns={2}>
					<Grid.Row>
						<Grid.Column verticalAlign='middle'>
							<Header content='Ability Scores' textAlign='center' />
							<Table striped textAlign='center'>
								<Table.Body>
									<Table.Row>
										<Table.Cell>Strength</Table.Cell>
										<Table.Cell>{strength.toString()}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Dexterity</Table.Cell>
										<Table.Cell>{dexterity.toString()}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Constitution</Table.Cell>
										<Table.Cell>{constitution.toString()}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Intelligence</Table.Cell>
										<Table.Cell>{intelligence.toString()}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Wisdom</Table.Cell>
										<Table.Cell>{wisdom.toString()}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Charisma</Table.Cell>
										<Table.Cell>{charisma.toString()}</Table.Cell>
									</Table.Row>
								</Table.Body>
							</Table>
						</Grid.Column>
						<Grid.Column>
							<Header content='Alignment Tendancies' textAlign='center' />
							<Divider />
							<Header content='Ethical' textAlign='center' />
							<Table compact='very' size='small' striped textAlign='center'>
								<Table.Body>
									<Table.Row>
										<Table.Cell>Lawful</Table.Cell>
										<Table.Cell>{this.createEntryItem(ethicalPositive)}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Neutral</Table.Cell>
										<Table.Cell>{this.createEntryItem(ethicalNeutral)}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Chaotic</Table.Cell>
										<Table.Cell>{this.createEntryItem(ethicalNegative)}</Table.Cell>
									</Table.Row>
								</Table.Body>
							</Table>
							<Header content='Moral' textAlign='center' />
							<Table compact='very' size='small' striped textAlign='center'>
								<Table.Body>
									<Table.Row>
										<Table.Cell>Good</Table.Cell>
										<Table.Cell>{this.createEntryItem(moralPositive)}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Neutral</Table.Cell>
										<Table.Cell>{this.createEntryItem(moralNeutral)}</Table.Cell>
									</Table.Row>
									<Table.Row>
										<Table.Cell>Evil</Table.Cell>
										<Table.Cell>{this.createEntryItem(moralNegative)}</Table.Cell>
									</Table.Row>
								</Table.Body>
							</Table>
						</Grid.Column>
					</Grid.Row>
				</Grid>

				<Header content='Plot Hook' />

			</div>
		);
	}

}