import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { organizationIdProperty } from './get';
import { organizationGetAllDescription } from './getAll';
import { organizationUpdateDescription } from './update';

const showOnlyForOrganization = { resource: ['organization'] };

export const organizationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForOrganization },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an organization',
				description: 'Get an organization by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/organizations/{{$parameter["organizationId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many organizations',
				description:
					"List organizations. With an Organization Access Token this returns the token's own organization.",
				routing: {
					request: { method: 'GET', url: '=/organizations/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an organization',
				description: "Update the organization's public profile and defaults",
				routing: {
					request: {
						method: 'PATCH',
						url: '=/organizations/{{$parameter["organizationId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('organization'),
	organizationIdProperty,
	...organizationGetAllDescription,
	...organizationUpdateDescription,
];
