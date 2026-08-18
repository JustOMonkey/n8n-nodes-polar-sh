import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['product'], operation: ['get'] };

export const productGetDescription: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
