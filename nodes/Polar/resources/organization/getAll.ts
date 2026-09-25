import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['organization'], operation: ['getAll'] };

export const organizationGetAllDescription: INodeProperties[] = [
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
				displayName: 'Slug',
				name: 'slug',
				type: 'string',
				default: '',
				routing: { request: { qs: { slug: '={{$value}}' } } },
			},
		],
	},
];
