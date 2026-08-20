import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhookEndpoint'], operation: ['resetSecret'] };

export const webhookEndpointResetSecretDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Endpoint ID',
		name: 'webhookEndpointId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Resetting the secret immediately invalidates the previous one',
	},
];
