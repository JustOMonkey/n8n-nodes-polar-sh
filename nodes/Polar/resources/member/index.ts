import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { memberIdentifierProperties } from './identifiers';
import { memberGetAllDescription } from './getAll';
import { memberCreateDescription } from './create';
import { memberUpdateDescription } from './update';

const showOnlyForMember = { resource: ['member'] };

const byId = '=/customers/{{$parameter["customerId"]}}/members';
const byExternalId = '=/customers/external/{{$parameter["externalCustomerId"]}}/members';

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
				description: 'Add a member to a B2B customer',
				routing: {
					request: { method: 'POST', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Create for External Customer',
				value: 'createExternal',
				action: 'Create a member for an external customer',
				description: "Add a member to a customer identified by your system's external ID",
				routing: {
					request: { method: 'POST', url: byExternalId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a member',
				description: 'Remove a member from a customer',
				routing: {
					request: {
						method: 'DELETE',
						url: `${byId}/{{$parameter["memberId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete by External ID',
				value: 'deleteExternal',
				action: 'Delete a member by external ID',
				description: 'Remove a member, both identified by external IDs',
				routing: {
					request: {
						method: 'DELETE',
						url: `${byExternalId}/{{$parameter["externalId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a member',
				description: 'Get a single member of a customer',
				routing: {
					request: {
						method: 'GET',
						url: `${byId}/{{$parameter["memberId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get by External ID',
				value: 'getByExternalId',
				action: 'Get a member by external ID',
				description: 'Get a single member, customer and member both identified by external IDs',
				routing: {
					request: {
						method: 'GET',
						url: `${byExternalId}/{{$parameter["externalId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many members',
				description: 'List the members of a customer',
				routing: {
					request: { method: 'GET', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many for External Customer',
				value: 'getAllExternal',
				action: 'Get many members of an external customer',
				description: "List the members of a customer identified by your system's external ID",
				routing: {
					request: { method: 'GET', url: byExternalId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a member',
				description: "Update a member's name, email or role",
				routing: {
					request: {
						method: 'PATCH',
						url: `${byId}/{{$parameter["memberId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update by External ID',
				value: 'updateExternal',
				action: 'Update a member by external ID',
				description: 'Update a member, customer and member both identified by external IDs',
				routing: {
					request: {
						method: 'PATCH',
						url: `${byExternalId}/{{$parameter["externalId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('member'),
	...memberIdentifierProperties,
	...memberGetAllDescription,
	...memberCreateDescription,
	...memberUpdateDescription,
];
