import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['customField'], operation: ['getAll'] };

export const customFieldGetAllDescription: INodeProperties[] = [
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
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Filter custom fields by name or slug',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'multiOptions',
				options: [
					{ name: 'Checkbox', value: 'checkbox' },
					{ name: 'Date', value: 'date' },
					{ name: 'Number', value: 'number' },
					{ name: 'Select', value: 'select' },
					{ name: 'Text', value: 'text' },
				],
				default: [],
				description: 'Filter custom fields by type',
				routing: { request: { qs: { type: '={{$value}}' } } },
			},
		],
	},
];
