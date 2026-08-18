import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['getInvoice'] };

export const orderGetInvoiceDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
