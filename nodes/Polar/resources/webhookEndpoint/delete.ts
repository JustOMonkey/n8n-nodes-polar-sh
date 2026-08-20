import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhookEndpoint'], operation: ['delete'] };

export const webhookEndpointDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Endpoint ID',
		name: 'webhookEndpointId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
