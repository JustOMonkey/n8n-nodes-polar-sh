import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['payment'], operation: ['get'] };

export const paymentGetDescription: INodeProperties[] = [
	{
		displayName: 'Payment ID',
		name: 'paymentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
