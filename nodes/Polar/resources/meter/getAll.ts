import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['meter'], operation: ['getAll'] };

export const meterGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Is Archived',
				name: 'is_archived',
				type: 'boolean',
				default: false,
				description: 'Whether to only return archived (or only non-archived) meters',
				routing: { request: { qs: { is_archived: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Filter meters by name',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
		],
	},
];
