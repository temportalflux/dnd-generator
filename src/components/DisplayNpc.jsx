import React from 'react';
import { Button } from 'semantic-ui-react';
import copyToClipboard from '../lib/clipboard';
import { renderToString } from 'react-dom/server';
import NpcArticleBlock from './NpcArticleBlock';

export default class DisplayNpc extends React.Component
{

	constructor(props)
	{
		super(props);
		this.exportRef = React.createRef();
	}

	onExport()
	{
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