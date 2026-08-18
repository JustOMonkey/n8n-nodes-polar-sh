import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['discount'], operation: ['get'] };

export const discountGetDescription: INodeProperties[] = [
	{
		displayName: 'Discount ID',
		name: 'discountId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
