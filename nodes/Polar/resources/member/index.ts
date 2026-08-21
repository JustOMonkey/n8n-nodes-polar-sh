import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { memberGetAllDescription } from './getAll';
import { memberGetDescription } from './get';
import { memberGetByExternalIdDescription } from './getByExternalId';
import { memberCreateDescription } from './create';
import { memberUpdateDescription } from './update';
import { memberDeleteDescription } from './delete';

const showOnlyForMember = { resource: ['member'] };

export const memberDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMember },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a member',
				description: 'Create a new member for a B2B customer',
				routing: {
					request: { method: 'POST', url: '=/members/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a member',
				description: 'Delete a member',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/members/{{$parameter["memberId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a member',
				description: 'Get a single member by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/members/{{$parameter["memberId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get by External ID',
				value: 'getByExternalId',
				action: 'Get a member by external ID',
				description: 'Get a single member by its external ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/members/external/{{$parameter["externalId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many members',
				description: 'Get many members',
				routing: {
					request: { method: 'GET', url: '=/members/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a member',
				description: 'Update an existing member (name and role only)',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/members/{{$parameter["memberId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('member'),
	...memberGetAllDescription,
	...memberGetDescription,
	...memberGetByExternalIdDescription,
	...memberCreateDescription,
	...memberUpdateDescription,
	...memberDeleteDescription,
];
