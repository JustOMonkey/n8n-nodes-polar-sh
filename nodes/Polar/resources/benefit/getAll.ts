import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['getAll'] };

export const benefitGetAllDescription: INodeProperties[] = [
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
				description: 'Search by benefit description',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Custom', value: 'custom' },
					{ name: 'Discord', value: 'discord' },
					{ name: 'Downloadables', value: 'downloadables' },
					{ name: 'Feature Flag', value: 'feature_flag' },
					{ name: 'GitHub Repository', value: 'github_repository' },
					{ name: 'License Keys', value: 'license_keys' },
					{ name: 'Meter Credit', value: 'meter_credit' },
					{ name: 'Slack Shared Channel', value: 'slack_shared_channel' },
				],
				default: 'custom',
				routing: { request: { qs: { type: '={{$value}}' } } },
			},
		],
	},
];
