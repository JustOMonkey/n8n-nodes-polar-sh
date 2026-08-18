import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['getGrants'] };

export const benefitGetGrantsDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
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
				displayName: 'Only Granted',
				name: 'is_granted',
				type: 'boolean',
				default: true,
				description: 'Whether to only return grants that are still active (not revoked)',
				routing: { request: { qs: { is_granted: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Member ID',
				name: 'member_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { member_id: '={{$value}}' } } },
			},
		],
	},
];
