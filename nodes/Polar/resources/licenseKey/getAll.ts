import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['licenseKey'], operation: ['getAll'] };

export const licenseKeyGetAllDescription: INodeProperties[] = [
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
				displayName: 'Benefit ID',
				name: 'benefit_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { benefit_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Disabled', value: 'disabled' },
					{ name: 'Granted', value: 'granted' },
					{ name: 'Revoked', value: 'revoked' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
