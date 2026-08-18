import type { INodeProperties } from 'n8n-workflow';

const showById = { resource: ['customer'], operation: ['delete'] };
const showByExternalId = { resource: ['customer'], operation: ['deleteExternal'] };

export const customerDeleteDescription: INodeProperties[] = [
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
	},
	{
		displayName: 'Anonymize',
		name: 'anonymize',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['customer'], operation: ['delete', 'deleteExternal'] } },
		description: 'Whether to scrub personally identifiable information instead of just soft-deleting the customer',
		routing: { request: { qs: { anonymize: '={{$value}}' } } },
	},
];
