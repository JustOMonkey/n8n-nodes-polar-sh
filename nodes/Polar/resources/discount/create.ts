import type { INodeProperties } from 'n8n-workflow';
import { currencyOptions, metadataField } from '../../shared/descriptions';

const show = { resource: ['discount'], operation: ['create'] };
const showFixed = { ...show, discountType: ['fixed'] };
const showPercentage = { ...show, discountType: ['percentage'] };
const showRepeating = { ...show, duration: ['repeating'] };

export const discountCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Displayed to the customer when the discount is applied',
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Discount Type',
		name: 'discountType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Fixed Amount', value: 'fixed' },
			{ name: 'Percentage', value: 'percentage' },
		],
		default: 'percentage',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Amount (Cents)',
		name: 'amount',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show: showFixed },
		routing: { send: { type: 'body', property: 'amount' } },
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		options: currencyOptions,
		default: 'usd',
		displayOptions: { show: showFixed },
		routing: { send: { type: 'body', property: 'currency' } },
	},
	{
		displayName: 'Basis Points',
		name: 'basis_points',
		type: 'number',
		default: 1000,
		required: true,
		displayOptions: { show: showPercentage },
		description: 'Discount percentage in basis points (1000 = 10%)',
		routing: { send: { type: 'body', property: 'basis_points' } },
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
		required: true,
		displayOptions: { show },
		description: 'For subscriptions: apply once on the first invoice, forever, or for a set number of months',
		routing: { send: { type: 'body', property: 'duration' } },
	},
	{
		displayName: 'Duration in Months',
		name: 'duration_in_months',
		type: 'number',
		default: 1,
		required: true,
		displayOptions: { show: showRepeating },
		routing: { send: { type: 'body', property: 'duration_in_months' } },
	},
	{
		displayName: 'Product Names or IDs',
		name: 'products',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		displayOptions: { show },
		description:
			'Products this discount can be applied to. Leave empty to allow it on any product. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'products', value: '={{ $value.length ? $value : undefined }}' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
				description: 'A code customers can enter at checkout to redeem this discount',
				routing: { request: { body: { code: '={{$value}}' } } },
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
				displayName: 'Max Redemptions Per Customer',
				name: 'max_redemptions_per_customer',
				type: 'number',
				default: 1,
				routing: { request: { body: { max_redemptions_per_customer: '={{$value}}' } } },
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
