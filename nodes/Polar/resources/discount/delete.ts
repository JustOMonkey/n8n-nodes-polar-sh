import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['discount'], operation: ['delete'] };

export const discountDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Discount ID',
		name: 'discountId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
