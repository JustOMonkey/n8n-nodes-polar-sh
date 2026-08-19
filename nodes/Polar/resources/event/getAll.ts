import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['event'], operation: ['getAll'] };

export const eventGetAllDescription: INodeProperties[] = [
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
				displayName: 'Depth',
				name: 'depth',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description:
					'Fetch descendants up to this depth (0 = root events only, 1 = roots + children, etc.). Leave this field out entirely to return all events regardless of depth.',
				routing: { request: { qs: { depth: '={{$value}}' } } },
			},
			{
				displayName: 'End Timestamp',
				name: 'end_timestamp',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { end_timestamp: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Meter ID',
				name: 'meter_id',
				type: 'string',
				default: '',
				description: "Filter to events matching a meter's filter clause",
				routing: { request: { qs: { meter_id: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter by event name',
				routing: { request: { qs: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Parent ID',
				name: 'parent_id',
				type: 'string',
				default: '',
				description: 'When combined with Depth, use this event as the anchor instead of root events',
				routing: { request: { qs: { parent_id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				routing: { request: { qs: { query: '={{$value}}' } } },
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
			{
				displayName: 'Start Timestamp',
				name: 'start_timestamp',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { start_timestamp: '={{$value}}' } } },
			},
		],
	},
];
