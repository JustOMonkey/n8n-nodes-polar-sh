import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { customFieldGetAllDescription } from './getAll';
import { customFieldGetDescription } from './get';
import { customFieldCreateDescription } from './create';
import { customFieldUpdateDescription } from './update';
import { customFieldDeleteDescription } from './delete';

const showOnlyForCustomField = { resource: ['customField'] };

export const customFieldDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomField },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a custom field',
				description: 'Create a new custom field',
				routing: {
					request: { method: 'POST', url: '=/custom-fields/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a custom field',
				description: 'Delete a custom field',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/custom-fields/{{$parameter["customFieldId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a custom field',
				description: 'Get a single custom field by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/custom-fields/{{$parameter["customFieldId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many custom fields',
				description: 'Get many custom fields',
				routing: {
					request: { method: 'GET', url: '=/custom-fields/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a custom field',
				description: 'Update an existing custom field',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/custom-fields/{{$parameter["customFieldId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('customField'),
	...customFieldGetAllDescription,
	...customFieldGetDescription,
	...customFieldCreateDescription,
	...customFieldUpdateDescription,
	...customFieldDeleteDescription,
];
