import type { INodeProperties } from 'n8n-workflow';
import { webhookEventTypeOptions } from '../../shared/descriptions';

const show = { resource: ['webhookEndpoint'], operation: ['create'] };

export const webhookEndpointCreateDescription: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The URL where the webhook events will be sent',
		routing: { send: { type: 'body', property: 'url' } },
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
		required: true,
		displayOptions: { show },
		description: 'The format of the webhook payload',
		routing: { send: { type: 'body', property: 'format' } },
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		options: webhookEventTypeOptions,
		default: [],
		required: true,
		displayOptions: { show },
		description: 'The events that will trigger the webhook',
		routing: { send: { type: 'body', property: 'events' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'An optional name for the webhook endpoint to help organize and identify it',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
		],
	},
];
