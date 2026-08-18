import type { INodeProperties } from 'n8n-workflow';
import { checkoutGetAllDescription } from './getAll';
import { checkoutGetDescription } from './get';
import { checkoutCreateDescription } from './create';
import { checkoutUpdateDescription } from './update';

const showOnlyForCheckout = { resource: ['checkout'] };

export const checkoutDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCheckout },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many checkouts',
				description: 'Get many checkout sessions',
				routing: { request: { method: 'GET', url: '=/checkouts/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a checkout',
				description: 'Get a single checkout session by ID',
				routing: { request: { method: 'GET', url: '=/checkouts/{{$parameter["checkoutId"]}}' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a checkout',
				description: 'Create a new checkout session',
				routing: { request: { method: 'POST', url: '=/checkouts/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a checkout',
				description: 'Update an existing checkout session',
				routing: { request: { method: 'PATCH', url: '=/checkouts/{{$parameter["checkoutId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...checkoutGetAllDescription,
	...checkoutGetDescription,
	...checkoutCreateDescription,
	...checkoutUpdateDescription,
];
