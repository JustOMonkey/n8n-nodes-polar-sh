import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
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
				routing: {
					request: { method: 'GET', url: '=/webhooks/deliveries', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
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
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('webhookDelivery'),
	...webhookDeliveryGetAllDescription,
	...webhookDeliveryRedeliverDescription,
];
