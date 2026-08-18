import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['checkout'], operation: ['getAll'] };

export const checkoutGetAllDescription: INodeProperties[] = [
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
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: "Search by customer name/email, checkout ID, or the checkout's product names",
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Confirmed', value: 'confirmed' },
					{ name: 'Expired', value: 'expired' },
					{ name: 'Failed', value: 'failed' },
					{ name: 'Open', value: 'open' },
					{ name: 'Succeeded', value: 'succeeded' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
