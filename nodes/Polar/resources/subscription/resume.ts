import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['resume'] };

export const subscriptionResumeDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Resumes a paused subscription immediately and starts a new billing period',
		routing: { send: { type: 'body', property: 'resume', value: '={{true}}' } },
	},
];
