import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties, webhookEventTypeOptions } from '../../shared/descriptions';

const show = { resource: ['webhookDelivery'], operation: ['getAll'] };

export const webhookDeliveryGetAllDescription: INodeProperties[] = [
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
				displayName: 'End Timestamp',
				name: 'end_timestamp',
				type: 'dateTime',
				default: '',
				description: 'Filter deliveries before this timestamp',
				routing: { request: { qs: { end_timestamp: '={{$value}}' } } },
			},
			{
				displayName: 'Endpoint ID',
				name: 'endpoint_id',
				type: 'string',
				default: '',
				description: 'Filter deliveries by the ID of the associated webhook endpoint',
				routing: { request: { qs: { endpoint_id: '={{$value}}' } } },
			},
			{
				displayName: 'Event Type',
				name: 'event_type',
				type: 'multiOptions',
				options: webhookEventTypeOptions,
				default: [],
				description: 'Filter deliveries by webhook event type',
				routing: { request: { qs: { event_type: '={{$value}}' } } },
			},
			{
				displayName: 'HTTP Code Class',
				name: 'http_code_class',
				type: 'options',
				options: [
					{ name: '2xx', value: '2xx' },
					{ name: '3xx', value: '3xx' },
					{ name: '4xx', value: '4xx' },
					{ name: '5xx', value: '5xx' },
				],
				default: '2xx',
				description: 'Filter deliveries by HTTP response code class',
				routing: { request: { qs: { http_code_class: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Free-text query to filter webhook deliveries',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Start Timestamp',
				name: 'start_timestamp',
				type: 'dateTime',
				default: '',
				description: 'Filter deliveries after this timestamp',
				routing: { request: { qs: { start_timestamp: '={{$value}}' } } },
			},
			{
				displayName: 'Succeeded',
				name: 'succeeded',
				type: 'boolean',
				default: true,
				description: 'Whether to filter deliveries by success status',
				routing: { request: { qs: { succeeded: '={{$value}}' } } },
			},
		],
	},
];
