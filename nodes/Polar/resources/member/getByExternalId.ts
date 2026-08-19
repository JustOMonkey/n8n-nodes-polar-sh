import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['getByExternalId'] };

export const memberGetByExternalIdDescription: INodeProperties[] = [
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: "The member's external ID",
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		description: 'One of Customer ID / External Customer ID is required by the API to disambiguate',
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
		],
	},
];
