import type { INodeProperties } from 'n8n-workflow';
import { availableScopeOptions } from '../../shared/descriptions';

const show = { resource: ['organizationAccessToken'], operation: ['update'] };

export const organizationAccessTokenUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Organization Access Token ID',
		name: 'organizationAccessTokenId',
		type: 'string',
		typeOptions: { password: true },
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
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				default: '',
				routing: { request: { body: { comment: '={{$value}}' } } },
			},
			{
				displayName: 'Scopes',
				name: 'scopes',
				type: 'multiOptions',
				options: availableScopeOptions,
				default: [],
				description: 'Leave empty to keep the existing scopes unchanged',
				routing: { request: { body: { scopes: '={{ $value.length ? $value : undefined }}' } } },
			},
		],
	},
];
