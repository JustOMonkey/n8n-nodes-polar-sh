import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['clearPendingUpdate'] };

export const subscriptionClearPendingUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Clears any scheduled subscription change (e.g. a pending downgrade)',
		routing: { send: { type: 'body', property: 'pending_update', value: '={{null}}' } },
	},
];
