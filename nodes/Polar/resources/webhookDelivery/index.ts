import type { INodeProperties } from 'n8n-workflow';
import { webhookDeliveryGetAllDescription } from './getAll';
import { webhookDeliveryRedeliverDescription } from './redeliver';

const showOnlyForWebhookDelivery = { resource: ['webhookDelivery'] };

export const webhookDeliveryDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForWebhookDelivery },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many webhook deliveries',
				description: 'Get many webhook deliveries',
				routing: { request: { method: 'GET', url: '=/webhooks/deliveries' } },
			},
			{
				name: 'Redeliver',
				value: 'redeliver',
				action: 'Redeliver a webhook event',
				description: 'Schedule the re-delivery of a webhook event',
				routing: {
					request: {
						method: 'POST',
						url: '=/webhooks/events/{{$parameter["webhookEventId"]}}/redeliver',
					},
				},
			},
		],
		default: 'getAll',
	},
	...webhookDeliveryGetAllDescription,
	...webhookDeliveryRedeliverDescription,
];
