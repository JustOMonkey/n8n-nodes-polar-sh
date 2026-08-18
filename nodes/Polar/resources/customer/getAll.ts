import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['customer'], operation: ['getAll'] };

export const customerGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Search by name or email',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: { request: { qs: { email: '={{$value}}' } } },
			},
			{
				displayName: 'Only Active',
				name: 'active',
				type: 'boolean',
				default: true,
				description: 'Whether to only return non-deleted, non-blocked customers',
				routing: { request: { qs: { active: '={{$value}}' } } },
			},
		],
	},
];
