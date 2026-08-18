import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['subscription'], operation: ['getAll'] };

export const subscriptionGetAllDescription: INodeProperties[] = [
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
				displayName: 'Cancel at Period End',
				name: 'cancel_at_period_end',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { cancel_at_period_end: '={{$value}}' } } },
			},
			{
				displayName: 'Canceled After',
				name: 'canceled_at_after',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { canceled_at_after: '={{$value}}' } } },
			},
			{
				displayName: 'Canceled Before',
				name: 'canceled_at_before',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { canceled_at_before: '={{$value}}' } } },
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
				displayName: 'Only Active',
				name: 'active',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { active: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Started After',
				name: 'started_after',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { started_after: '={{$value}}' } } },
			},
			{
				displayName: 'Started Before',
				name: 'started_before',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { started_before: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Canceled', value: 'canceled' },
					{ name: 'Incomplete', value: 'incomplete' },
					{ name: 'Incomplete Expired', value: 'incomplete_expired' },
					{ name: 'Past Due', value: 'past_due' },
					{ name: 'Paused', value: 'paused' },
					{ name: 'Trialing', value: 'trialing' },
					{ name: 'Unpaid', value: 'unpaid' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
