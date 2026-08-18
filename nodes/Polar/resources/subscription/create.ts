import type { INodeProperties } from 'n8n-workflow';
import { metadataField, productLocator } from '../../shared/descriptions';

const show = { resource: ['subscription'], operation: ['create'] };
const showCustomerId = { ...show, customerReferenceType: ['customerId'] };
const showExternalId = { ...show, customerReferenceType: ['externalId'] };

export const subscriptionCreateDescription: INodeProperties[] = [
	{
		...productLocator('productId', 'Product', show, true),
		description: 'Must be a free recurring product — paid products require the checkout flow',
		routing: { send: { type: 'body', property: 'product_id', value: '={{$value.value}}' } },
	},
	{
		displayName: 'Customer Reference Type',
		name: 'customerReferenceType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Customer ID', value: 'customerId' },
			{ name: 'External Customer ID', value: 'externalId' },
		],
		default: 'customerId',
	},
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showCustomerId },
		routing: { send: { type: 'body', property: 'customer_id' } },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showExternalId },
		routing: { send: { type: 'body', property: 'external_customer_id' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
];
