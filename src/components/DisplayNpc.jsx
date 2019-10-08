import React from 'react';
import { Header, Button, List, Popup, Table, Grid, Divider } from 'semantic-ui-react';
import copyToClipboard from '../lib/clipboard';
import lodash from 'lodash';
import { renderToString } from 'react-dom/server';
import NpcArticleBlock from './NpcArticleBlock';

const formatData = (data) => renderToString(
<div>
	<Header as='h1'>Description</Header>
	<p>Some paragraph text here.</p>
	<ul>
		{data.description.map((text, i) => (<li key={i}>{text}</li>))}
	</ul>
</div>
);

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
				'DescriptionItem1',
				'DescriptionItem2',
				'DescriptionItem3',
			]
		}));
		//*/
		copyToClipboard(renderToString(
			<NpcArticleBlock
				generator={this.props.generator}
				usePlainText={true}
			/>
		));
	}

	render()
	{
		const { generator } = this.props;

		console.log(generator, generator.getAllValues());

		return (
			<div>
				<Button onClick={this.onExport.bind(this)}>Export</Button>

				<NpcArticleBlock
					generator={generator}
					usePlainText={false}
				/>

			</div>
		);
	}

}