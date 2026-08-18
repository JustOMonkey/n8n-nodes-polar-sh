import type { INodeProperties } from 'n8n-workflow';

const showById = { resource: ['customer'], operation: ['get'] };
const showByExternalId = { resource: ['customer'], operation: ['getExternal'] };

export const customerGetDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showById },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showByExternalId },
		description: 'The customer ID in your own system, as set when the customer was created',
	},
];
