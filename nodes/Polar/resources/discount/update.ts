import type { INodeProperties } from 'n8n-workflow';
import { currencyOptions, metadataField } from '../../shared/descriptions';

const show = { resource: ['discount'], operation: ['update'] };

export const discountUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Discount ID',
		name: 'discountId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Product Names or IDs',
		name: 'products',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		displayOptions: { show },
		description:
			'Leave empty to keep the existing products. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'products', value: '={{ $value.length ? $value : undefined }}' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Amount (Cents)',
				name: 'amount',
				type: 'number',
				default: 0,
				routing: { request: { body: { amount: '={{$value}}' } } },
			},
			{
				displayName: 'Basis Points',
				name: 'basis_points',
				type: 'number',
				default: 1000,
				routing: { request: { body: { basis_points: '={{$value}}' } } },
			},
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
				routing: { request: { body: { code: '={{$value}}' } } },
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: currencyOptions,
				default: 'usd',
				routing: { request: { body: { currency: '={{$value}}' } } },
			},
			{
				displayName: 'Discount Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Fixed Amount', value: 'fixed' },
					{ name: 'Percentage', value: 'percentage' },
				],
				default: 'percentage',
				routing: { request: { body: { type: '={{$value}}' } } },
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				options: [
					{ name: 'Once', value: 'once' },
					{ name: 'Forever', value: 'forever' },
					{ name: 'Repeating', value: 'repeating' },
				],
				default: 'once',
				routing: { request: { body: { duration: '={{$value}}' } } },
			},
			{
				displayName: 'Duration in Months',
				name: 'duration_in_months',
				type: 'number',
				default: 1,
				routing: { request: { body: { duration_in_months: '={{$value}}' } } },
			},
			{
				displayName: 'Ends At',
				name: 'ends_at',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { ends_at: '={{$value}}' } } },
			},
			{
				displayName: 'Max Redemptions',
				name: 'max_redemptions',
				type: 'number',
				default: 1,
				routing: { request: { body: { max_redemptions: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Starts At',
				name: 'starts_at',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { starts_at: '={{$value}}' } } },
			},
		],
	},
];
