import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { productGetAllDescription } from './getAll';
import { productGetDescription } from './get';
import { productCreateDescription } from './create';
import { productUpdateDescription } from './update';
import { productUpdateBenefitsDescription } from './updateBenefits';

const showOnlyForProduct = { resource: ['product'] };

export const productDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForProduct },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a product',
				description: 'Create a new product',
				routing: {
					request: { method: 'POST', url: '=/products/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a product',
				description: 'Get a single product by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/products/{{$parameter["productId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many products',
				description: 'Get many products',
				routing: {
					request: { method: 'GET', url: '=/products/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a product',
				description: 'Update an existing product',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/products/{{$parameter["productId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update Benefits',
				value: 'updateBenefits',
				action: 'Update a product benefits',
				description: 'Replace the set of benefits granted by this product',
				routing: {
					request: {
						method: 'POST',
						url: '=/products/{{$parameter["productId"]}}/benefits',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('product'),
	...productGetAllDescription,
	...productGetDescription,
	...productCreateDescription,
	...productUpdateDescription,
	...productUpdateBenefitsDescription,
];
