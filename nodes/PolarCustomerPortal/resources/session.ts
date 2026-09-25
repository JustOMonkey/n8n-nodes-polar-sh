import type { INodeProperties } from 'n8n-workflow';
import { portalRouting } from '../shared/errorHandling';

const resource = ['session'];

export const sessionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get User',
				value: 'getUser',
				action: 'Get the authenticated user',
				description: 'Get who the session belongs to (customer or member, with role)',
				routing: portalRouting('GET', '=/customer-portal/customer-session/user'),
			},
			{
				name: 'Introspect',
				value: 'introspect',
				action: 'Introspect the session',
				description: 'Get when the session token expires and its return URL',
				routing: portalRouting('GET', '=/customer-portal/customer-session/introspect'),
			},
		],
		default: 'getUser',
	},
];
