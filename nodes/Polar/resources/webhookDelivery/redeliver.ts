import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhookDelivery'], operation: ['redeliver'] };

export const webhookDeliveryRedeliverDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Event ID',
		name: 'webhookEventId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The ID of the webhook event to redeliver (not the delivery ID or the endpoint ID)',
	},
];
