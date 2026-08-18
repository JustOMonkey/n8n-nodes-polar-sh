import type { INodeProperties } from 'n8n-workflow';
import { discountGetAllDescription } from './getAll';
import { discountGetDescription } from './get';
import { discountCreateDescription } from './create';
import { discountUpdateDescription } from './update';
import { discountDeleteDescription } from './delete';

const showOnlyForDiscount = { resource: ['discount'] };

export const discountDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForDiscount },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a discount',
				description: 'Create a new discount',
				routing: { request: { method: 'POST', url: '=/discounts/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a discount',
				description: 'Delete a discount',
				routing: { request: { method: 'DELETE', url: '=/discounts/{{$parameter["discountId"]}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a discount',
				description: 'Get a single discount by ID',
				routing: { request: { method: 'GET', url: '=/discounts/{{$parameter["discountId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many discounts',
				description: 'Get many discounts',
				routing: { request: { method: 'GET', url: '=/discounts/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a discount',
				description: 'Update an existing discount',
				routing: { request: { method: 'PATCH', url: '=/discounts/{{$parameter["discountId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...discountGetAllDescription,
	...discountGetDescription,
	...discountCreateDescription,
	...discountUpdateDescription,
	...discountDeleteDescription,
];
