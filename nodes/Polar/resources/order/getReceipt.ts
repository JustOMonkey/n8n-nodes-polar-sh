import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['getReceipt'] };

export const orderGetReceiptDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
