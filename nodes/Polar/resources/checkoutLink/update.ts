import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['checkoutLink'], operation: ['update'] };

export const checkoutLinkUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Checkout Link ID',
		name: 'checkoutLinkId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Product Names or IDs',
		name: 'products',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		displayOptions: { show },
		description: 'Leave empty to keep the existing products. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: {
			send: {
				type: 'body',
				property: 'products',
				value: '={{ $value.length ? $value : undefined }}',
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Allow Discount Codes',
				name: 'allow_discount_codes',
				type: 'boolean',
				default: true,
				routing: { request: { body: { allow_discount_codes: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				routing: { request: { body: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				default: '',
				routing: { request: { body: { label: '={{$value}}' } } },
			},
			{
				displayName: 'Require Billing Address',
				name: 'require_billing_address',
				type: 'boolean',
				default: false,
				routing: { request: { body: { require_billing_address: '={{$value}}' } } },
			},
			{
				displayName: 'Return URL',
				name: 'return_url',
				type: 'string',
				default: '',
				routing: { request: { body: { return_url: '={{$value}}' } } },
			},
			{
				displayName: 'Seats',
				name: 'seats',
				type: 'number',
				default: 1,
				routing: { request: { body: { seats: '={{$value}}' } } },
			},
			{
				displayName: 'Success URL',
				name: 'success_url',
				type: 'string',
				default: '',
				routing: { request: { body: { success_url: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval',
				name: 'trial_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { trial_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval Count',
				name: 'trial_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { trial_interval_count: '={{$value}}' } } },
			},
		],
	},
];
