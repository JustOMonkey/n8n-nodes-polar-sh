import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['checkoutLink'], operation: ['get'] };

export const checkoutLinkGetDescription: INodeProperties[] = [
	{
		displayName: 'Checkout Link ID',
		name: 'checkoutLinkId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
