import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['order'], operation: ['getAll'] };

export const orderGetAllDescription: INodeProperties[] = [
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
				routing: { request: { qs: { checkout_id: '={{$value}}' } } },
			},
			{
				displayName: 'Created After',
				name: 'created_after',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { created_after: '={{$value}}' } } },
			},
			{
				displayName: 'Created Before',
				name: 'created_before',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { created_before: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Product Billing Type',
				name: 'product_billing_type',
				type: 'options',
				options: [
					{ name: 'One Time', value: 'one_time' },
					{ name: 'Recurring', value: 'recurring' },
				],
				default: 'one_time',
				routing: { request: { qs: { product_billing_type: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Draft', value: 'draft' },
					{ name: 'Paid', value: 'paid' },
					{ name: 'Partially Refunded', value: 'partially_refunded' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Refunded', value: 'refunded' },
					{ name: 'Void', value: 'void' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
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
