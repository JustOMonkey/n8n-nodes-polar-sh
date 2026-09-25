import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['metric'], operation: ['export', 'get'] };

export const metricQueryProperties: INodeProperties[] = [
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Only the date part (YYYY-MM-DD) is used — pass an ISO date/time or a Luxon DateTime',
		routing: { send: { type: 'query', property: 'start_date', value: '={{ String($value).slice(0, 10) }}' } },
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Only the date part (YYYY-MM-DD) is used — pass an ISO date/time or a Luxon DateTime',
		routing: { send: { type: 'query', property: 'end_date', value: '={{ String($value).slice(0, 10) }}' } },
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
		routing: { send: { type: 'query', property: 'interval' } },
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
				displayName: 'Billing Type',
				name: 'billing_type',
				type: 'multiOptions',
				options: [
					{ name: 'One Time', value: 'one_time' },
					{ name: 'Recurring', value: 'recurring' },
				],
				default: [],
				routing: { request: { qs: { billing_type: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Metrics',
				name: 'metrics',
				type: 'string',
				default: '',
				placeholder: 'revenue, orders',
				description: 'Comma-separated metric slugs to compute. Leave empty for all metrics.',
				routing: {
					request: {
						qs: {
							metrics:
								'={{ (Array.isArray($value) ? $value : String($value).split(",")).map(s => String(s).trim()).filter(s => s) }}',
						},
					},
				},
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				placeholder: 'Europe/Paris',
				description: 'IANA time zone for the timestamps (defaults to UTC)',
				routing: { request: { qs: { timezone: '={{$value}}' } } },
			},
		],
	},
];
