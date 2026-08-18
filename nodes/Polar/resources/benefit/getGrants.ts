import type { INodeProperties } from 'n8n-workflow';

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
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show },
		description: 'Whether to return all results or only up to a given limit',
		routing: { send: { paginate: '={{$value}}' } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: { show: { ...show, returnAll: [false] } },
		description: 'Max number of results to return',
		routing: { send: { type: 'query', property: 'limit' } },
	},
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
