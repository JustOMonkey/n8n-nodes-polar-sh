import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['checkoutLink'], operation: ['getAll'] };

export const checkoutLinkGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Organization ID',
				name: 'organization_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { organization_id: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
		],
	},
];
