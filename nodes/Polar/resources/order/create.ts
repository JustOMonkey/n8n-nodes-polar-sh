import type { INodeProperties } from 'n8n-workflow';
import { currencyOptions, customerLocator, metadataField, productLocator } from '../../shared/descriptions';

const show = { resource: ['order'], operation: ['create'] };

export const orderCreateDescription: INodeProperties[] = [
	{
		...customerLocator(show, true),
		description: 'Must belong to the same organization as the order',
		routing: { send: { type: 'body', property: 'customer_id', value: '={{$value.value}}' } },
	},
	{
		...productLocator('productId', 'Product', show, true),
		description: 'A free or fixed-price one-time product to charge for',
		routing: { send: { type: 'body', property: 'product_id', value: '={{$value.value}}' } },
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
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: currencyOptions,
				default: 'usd',
				routing: { request: { body: { currency: '={{$value}}' } } },
			},
			{
				displayName: 'Amount (Cents)',
				name: 'amount',
				type: 'number',
				default: 0,
				routing: { request: { body: { amount: '={{$value}}' } } },
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				routing: { request: { body: { description: '={{$value}}' } } },
			},
		],
	},
];
