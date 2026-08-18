import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['discount'], operation: ['getAll'] };

export const discountGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Search by discount name or code',
		routing: { request: { qs: { query: '={{$value}}' } } },
	},
];
