import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['payment'], operation: ['getAll'] };

export const paymentGetAllDescription: INodeProperties[] = [
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
				displayName: 'Checkout ID',
				name: 'checkout_id',
				type: 'string',
				default: '',
				description: 'Filter payments by the ID of the associated checkout',
				routing: { request: { qs: { checkout_id: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Email',
				name: 'customer_email',
				type: 'string',
				default: '',
				description: 'Filter payments by the customer email',
				routing: { request: { qs: { customer_email: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				description: 'Filter payments by the ID of the associated customer',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Method',
				name: 'method',
				type: 'string',
				default: '',
				description: 'Filter payments by payment method (e.g. "card")',
				routing: { request: { qs: { method: '={{$value}}' } } },
			},
			{
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
				description: 'Filter payments by the ID of the associated order',
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Failed', value: 'failed' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Succeeded', value: 'succeeded' },
				],
				default: [],
				description: 'Filter payments by status',
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
