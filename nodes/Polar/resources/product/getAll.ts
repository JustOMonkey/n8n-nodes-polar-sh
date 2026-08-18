import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['product'], operation: ['getAll'] };

export const productGetAllDescription: INodeProperties[] = [
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
				displayName: 'Benefit ID',
				name: 'benefit_id',
				type: 'string',
				default: '',
				description: 'Only return products that grant this benefit',
				routing: { request: { qs: { benefit_id: '={{$value}}' } } },
			},
			{
				displayName: 'Only Archived',
				name: 'is_archived',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { is_archived: '={{$value}}' } } },
			},
			{
				displayName: 'Only Recurring',
				name: 'is_recurring',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { is_recurring: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'id',
				type: 'string',
				default: '',
				routing: { request: { qs: { id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Search by product name',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Visibility',
				name: 'visibility',
				type: 'multiOptions',
				options: [
					{ name: 'Draft', value: 'draft' },
					{ name: 'Private', value: 'private' },
					{ name: 'Public', value: 'public' },
				],
				default: [],
				routing: { request: { qs: { visibility: '={{$value}}' } } },
			},
		],
	},
];
