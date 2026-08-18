import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['revoke'] };

export const subscriptionRevokeDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Cancels and revokes the subscription immediately, along with any granted benefits',
	},
];
