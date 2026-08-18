import type { INodeProperties } from 'n8n-workflow';
import { checkoutLinkGetAllDescription } from './getAll';
import { checkoutLinkGetDescription } from './get';
import { checkoutLinkCreateDescription } from './create';
import { checkoutLinkUpdateDescription } from './update';
import { checkoutLinkDeleteDescription } from './delete';

const showOnlyForCheckoutLink = { resource: ['checkoutLink'] };

export const checkoutLinkDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCheckoutLink },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a checkout link',
				description: 'Create a new checkout link',
				routing: { request: { method: 'POST', url: '=/checkout-links/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a checkout link',
				description: 'Delete a checkout link',
				routing: { request: { method: 'DELETE', url: '=/checkout-links/{{$parameter["checkoutLinkId"]}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a checkout link',
				description: 'Get a single checkout link by ID',
				routing: { request: { method: 'GET', url: '=/checkout-links/{{$parameter["checkoutLinkId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many checkout links',
				description: 'Get many checkout links',
				routing: { request: { method: 'GET', url: '=/checkout-links/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a checkout link',
				description: 'Update an existing checkout link',
				routing: { request: { method: 'PATCH', url: '=/checkout-links/{{$parameter["checkoutLinkId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...checkoutLinkGetAllDescription,
	...checkoutLinkGetDescription,
	...checkoutLinkCreateDescription,
	...checkoutLinkUpdateDescription,
	...checkoutLinkDeleteDescription,
];
