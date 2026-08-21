import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
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
				routing: {
					request: { method: 'GET', url: '=/checkouts/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a checkout',
				description: 'Get a single checkout session by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/checkouts/{{$parameter["checkoutId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a checkout',
				description: 'Create a new checkout session',
				routing: {
					request: { method: 'POST', url: '=/checkouts/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a checkout',
				description: 'Update an existing checkout session',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/checkouts/{{$parameter["checkoutId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('checkout'),
	...checkoutGetAllDescription,
	...checkoutGetDescription,
	...checkoutCreateDescription,
	...checkoutUpdateDescription,
];
