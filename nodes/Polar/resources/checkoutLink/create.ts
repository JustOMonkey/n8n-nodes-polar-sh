import type { INodeProperties } from 'n8n-workflow';
import { metadataField, productLocator } from '../../shared/descriptions';

const show = { resource: ['checkoutLink'], operation: ['create'] };
const showSingleProduct = { ...show, linkType: ['singleProduct'] };
const showSinglePrice = { ...show, linkType: ['singlePrice'] };
const showMultipleProducts = { ...show, linkType: ['multipleProducts'] };

export const checkoutLinkCreateDescription: INodeProperties[] = [
	{
		displayName: 'Link Type',
		name: 'linkType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Single Product', value: 'singleProduct', description: 'Link to one product; the customer picks its default price' },
			{ name: 'Single Product Price', value: 'singlePrice', description: 'Link to one specific price of a product' },
			{ name: 'Multiple Products', value: 'multipleProducts', description: 'Let the customer choose among several products at checkout' },
		],
		default: 'singleProduct',
	},
	{
		...productLocator('productId', 'Product', showSingleProduct),
		routing: { send: { type: 'body', property: 'product_id', value: '={{$value.value}}' } },
	},
	{
		displayName: 'Product Price ID',
		name: 'productPriceId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showSinglePrice },
		routing: { send: { type: 'body', property: 'product_price_id' } },
	},
	{
		displayName: 'Product Names or IDs',
		name: 'products',
		type: 'multiOptions',
		description: 'Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		required: true,
		displayOptions: { show: showMultipleProducts },
		routing: { send: { type: 'body', property: 'products' } },
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
				displayName: 'Payment Processor',
				name: 'payment_processor',
				type: 'options',
				options: [{ name: 'Stripe', value: 'stripe' }],
				default: 'stripe',
				description: 'Only Stripe is currently supported by the Polar API',
				routing: { request: { body: { payment_processor: '={{$value}}' } } },
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
