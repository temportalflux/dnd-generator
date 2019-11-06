import React, { useState } from 'react';
import { Segment, Accordion, Icon } from 'semantic-ui-react';
import { TableFilter } from '../TableFilter';

function camelCaseToTitle(str)
{
	return str
		.split(/(?=[A-Z])/)
		.map(
			(word) => `${word[0].toUpperCase()}${word.substr(1).toLowerCase()}`
		).join(' ');
}

export function DataViewEntry({
	propertyKey, tableCollection,
	active, onClick
})
{
	// <TableFilter tableKey='identity/sex' />
	return (
		<div>
			<Accordion.Title
				index={propertyKey}
				active={active}
				onClick={onClick}
			>
				<Icon name='dropdown' />
				{camelCaseToTitle(propertyKey)}
			</Accordion.Title>
			<Accordion.Content
				active={active}
			>
				<Segment>
					TODO {camelCaseToTitle(propertyKey)} properties
					
				</Segment>
			</Accordion.Content>
		</div>
	);
}
