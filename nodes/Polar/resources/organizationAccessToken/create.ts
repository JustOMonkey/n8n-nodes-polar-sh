import type { INodeProperties } from 'n8n-workflow';
import { availableScopeOptions } from '../../shared/descriptions';

const show = { resource: ['organizationAccessToken'], operation: ['create'] };

export const organizationAccessTokenCreateDescription: INodeProperties[] = [
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'A note to help you identify this token later',
		routing: { send: { type: 'body', property: 'comment' } },
	},
	{
		displayName: 'Scopes',
		name: 'scopes',
		type: 'multiOptions',
		options: availableScopeOptions,
		default: [],
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'scopes' } },
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
				displayName: 'Expires In',
				name: 'expires_in',
				type: 'string',
				default: '',
				description: "ISO 8601 duration string, e.g. 'P30D' for 30 days. Leave empty for a token that never expires.",
				routing: { request: { body: { expires_in: '={{$value}}' } } },
			},
		],
	},
];
