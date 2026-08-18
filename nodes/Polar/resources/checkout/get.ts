import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['checkout'], operation: ['get'] };

export const checkoutGetDescription: INodeProperties[] = [
	{
		displayName: 'Checkout ID',
		name: 'checkoutId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The ID of the checkout session',
	},
];
