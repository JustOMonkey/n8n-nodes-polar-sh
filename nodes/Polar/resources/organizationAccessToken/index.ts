import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { organizationAccessTokenGetAllDescription } from './getAll';
import { organizationAccessTokenCreateDescription } from './create';
import { organizationAccessTokenUpdateDescription } from './update';
import { organizationAccessTokenDeleteDescription } from './delete';

const showOnlyForOrganizationAccessToken = { resource: ['organizationAccessToken'] };

export const organizationAccessTokenDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForOrganizationAccessToken },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an organization access token',
				description:
					'Create a new organization access token. The raw token value is only ever returned once, in this response — capture it immediately.',
				routing: {
					request: {
						method: 'POST',
						url: '=/organization-access-tokens/',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an organization access token',
				description: 'Delete an organization access token',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/organization-access-tokens/{{$parameter["organizationAccessTokenId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many organization access tokens',
				description: 'Get many organization access tokens',
				routing: {
					request: {
						method: 'GET',
						url: '=/organization-access-tokens/',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an organization access token',
				description: 'Update an existing organization access token',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/organization-access-tokens/{{$parameter["organizationAccessTokenId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('organizationAccessToken'),
	...organizationAccessTokenGetAllDescription,
	...organizationAccessTokenCreateDescription,
	...organizationAccessTokenUpdateDescription,
	...organizationAccessTokenDeleteDescription,
];
