import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['eventType'], operation: ['getAll'] };

export const eventTypeGetAllDescription: INodeProperties[] = [
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
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Parent ID',
				name: 'parent_id',
				type: 'string',
				default: '',
				description: 'Filter by a specific parent event ID',
				routing: { request: { qs: { parent_id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Filter event types by name or label',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Root Events Only',
				name: 'root_events',
				type: 'boolean',
				default: false,
				description: 'Whether to only return event types that have root events (no parent)',
				routing: { request: { qs: { root_events: '={{$value}}' } } },
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{ name: 'System', value: 'system' },
					{ name: 'User', value: 'user' },
				],
				default: 'user',
				routing: { request: { qs: { source: '={{$value}}' } } },
			},
		],
	},
];
