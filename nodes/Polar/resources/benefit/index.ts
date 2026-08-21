import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { benefitGetAllDescription } from './getAll';
import { benefitGetDescription } from './get';
import { benefitCreateDescription } from './create';
import { benefitUpdateDescription } from './update';
import { benefitDeleteDescription } from './delete';
import { benefitGetGrantsDescription } from './getGrants';

const showOnlyForBenefit = { resource: ['benefit'] };

export const benefitDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForBenefit },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a benefit',
				description: 'Create a new benefit',
				routing: {
					request: { method: 'POST', url: '=/benefits/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a benefit',
				description: 'Delete a benefit',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/benefits/{{$parameter["benefitId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a benefit',
				description: 'Get a single benefit by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/benefits/{{$parameter["benefitId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Grants',
				value: 'getGrants',
				action: 'Get benefit grants',
				description: 'List the grants of a benefit across customers',
				routing: {
					request: {
						method: 'GET',
						url: '=/benefits/{{$parameter["benefitId"]}}/grants',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many benefits',
				description: 'Get many benefits',
				routing: {
					request: { method: 'GET', url: '=/benefits/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a benefit',
				description: 'Update an existing benefit',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/benefits/{{$parameter["benefitId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('benefit'),
	...benefitGetAllDescription,
	...benefitGetDescription,
	...benefitCreateDescription,
	...benefitUpdateDescription,
	...benefitDeleteDescription,
	...benefitGetGrantsDescription,
];
