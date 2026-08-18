import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['get'] };

export const subscriptionGetDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
