import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['organizationAccessToken'], operation: ['delete'] };

export const organizationAccessTokenDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Organization Access Token ID',
		name: 'organizationAccessTokenId',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		displayOptions: { show },
	},
];
