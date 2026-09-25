import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['member'], operation: ['getAll', 'getAllExternal'] };

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
