import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['meter'], operation: ['getQuantities'] };

export const meterGetQuantitiesDescription: INodeProperties[] = [
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Start Timestamp',
		name: 'startTimestamp',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { qs: { start_timestamp: '={{$value}}' } } },
	},
	{
		displayName: 'End Timestamp',
		name: 'endTimestamp',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { qs: { end_timestamp: '={{$value}}' } } },
	},
	{
		displayName: 'Interval',
		name: 'interval',
		type: 'options',
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Hour', value: 'hour' },
			{ name: 'Month', value: 'month' },
			{ name: 'Week', value: 'week' },
			{ name: 'Year', value: 'year' },
		],
		default: 'day',
		required: true,
		displayOptions: { show },
		routing: { request: { qs: { interval: '={{$value}}' } } },
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
				displayName: 'Customer Aggregation Function',
				name: 'customer_aggregation_function',
				type: 'options',
				options: [
					{ name: 'Average', value: 'avg' },
					{ name: 'Count', value: 'count' },
					{ name: 'Maximum', value: 'max' },
					{ name: 'Minimum', value: 'min' },
					{ name: 'Sum', value: 'sum' },
					{ name: 'Unique', value: 'unique' },
				],
				default: 'sum',
				description:
					'If set, quantities are first computed per customer before being aggregated with this function. Leave unset to aggregate across all customers directly.',
				routing: { request: { qs: { customer_aggregation_function: '={{$value}}' } } },
			},
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
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: 'UTC',
				description: 'Timezone to use for the timestamps',
				routing: { request: { qs: { timezone: '={{$value}}' } } },
			},
		],
	},
];
