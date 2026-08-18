import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['refund'], operation: ['getAll'] };

export const refundGetAllDescription: INodeProperties[] = [
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
				displayName: 'Only Succeeded',
				name: 'succeeded',
				type: 'boolean',
				default: true,
				description: 'Whether to only return succeeded refunds',
				routing: { request: { qs: { succeeded: '={{$value}}' } } },
			},
			{
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Subscription ID',
				name: 'subscription_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { subscription_id: '={{$value}}' } } },
			},
		],
	},
];
