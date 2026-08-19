import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['member'], operation: ['getAll'] };

export const memberGetAllDescription: INodeProperties[] = [
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
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{ name: 'Billing Manager', value: 'billing_manager' },
					{ name: 'Member', value: 'member' },
					{ name: 'Owner', value: 'owner' },
				],
				default: 'member',
				routing: { request: { qs: { role: '={{$value}}' } } },
			},
		],
	},
];
