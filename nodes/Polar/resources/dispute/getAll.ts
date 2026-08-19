import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['dispute'], operation: ['getAll'] };

export const disputeGetAllDescription: INodeProperties[] = [
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
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
				description: 'Filter disputes by the ID of the associated order',
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Early Warning', value: 'early_warning' },
					{ name: 'Lost', value: 'lost' },
					{ name: 'Needs Response', value: 'needs_response' },
					{ name: 'Prevented', value: 'prevented' },
					{ name: 'Under Review', value: 'under_review' },
					{ name: 'Won', value: 'won' },
				],
				default: [],
				description: 'Filter disputes by status',
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
