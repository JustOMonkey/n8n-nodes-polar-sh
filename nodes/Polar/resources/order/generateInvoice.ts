import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['generateInvoice'] };

export const orderGenerateInvoiceDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Triggers generation of an invoice PDF for this order (async — poll Get Invoice for the URL)',
	},
];
