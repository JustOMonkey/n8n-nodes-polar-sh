import type { INodeProperties } from 'n8n-workflow';

const showById = { resource: ['customer'], operation: ['getState'] };
const showByExternalId = { resource: ['customer'], operation: ['getStateExternal'] };

export const customerGetStateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showById },
		description: 'Returns a consolidated view of active subscriptions, orders and benefit grants for this customer',
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showByExternalId },
	},
];
