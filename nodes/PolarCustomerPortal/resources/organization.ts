import type { INodeProperties } from 'n8n-workflow';
import { portalRouting } from '../shared/errorHandling';

const resource = ['organization'];

export const organizationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an organization',
				description:
					"Get an organization's public customer portal info and products by slug (no customer session needed)",
				routing: portalRouting('GET', '=/customer-portal/organizations/{{$parameter["slug"]}}'),
			},
		],
		default: 'get',
	},
	{
		displayName: 'Organization Slug',
		name: 'slug',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['get'] } },
		description: 'The slug from the organization\'s Polar URL, e.g. "acme" in polar.sh/acme',
	},
];
