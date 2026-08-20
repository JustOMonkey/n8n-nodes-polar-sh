import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhookEndpoint'], operation: ['get'] };

export const webhookEndpointGetDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Endpoint ID',
		name: 'webhookEndpointId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
