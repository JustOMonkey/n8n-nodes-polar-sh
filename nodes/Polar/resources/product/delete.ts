import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['product'], operation: ['delete'] };

export const productDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description:
			'Only products with no orders, subscriptions, trials or discounts can be deleted — archive products in use with Update instead',
	},
];
