import type { INodeProperties } from 'n8n-workflow';
import { webhookEventTypeOptions } from '../../shared/descriptions';

const show = { resource: ['webhookEndpoint'], operation: ['update'] };

export const webhookEndpointUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Endpoint ID',
		name: 'webhookEndpointId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Enabled',
				name: 'enabled',
				type: 'boolean',
				default: true,
				description: 'Whether the webhook endpoint is enabled and will receive events',
				routing: { request: { body: { enabled: '={{$value}}' } } },
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: webhookEventTypeOptions,
				default: [],
				description: 'Leave empty to keep the existing events unchanged',
				routing: { request: { body: { events: '={{ $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				options: [
					{ name: 'Discord', value: 'discord' },
					{ name: 'Raw', value: 'raw' },
					{ name: 'Slack', value: 'slack' },
				],
				default: 'raw',
				description: 'The format of the webhook payload',
				routing: { request: { body: { format: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'An optional name for the webhook endpoint to help organize and identify it',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				description: 'The URL where the webhook events will be sent',
				routing: { request: { body: { url: '={{$value}}' } } },
			},
		],
	},
];
