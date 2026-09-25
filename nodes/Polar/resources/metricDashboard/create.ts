import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['metricDashboard'], operation: ['create'] };

export const metricDashboardCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Metrics',
				name: 'metrics',
				type: 'string',
				default: '',
				placeholder: 'revenue, orders',
				description: 'Comma-separated metric slugs to display (max 10)',
				routing: {
					request: {
						body: {
							metrics:
								'={{ (Array.isArray($value) ? $value : String($value).split(",")).map(s => String(s).trim()).filter(s => s) }}',
						},
					},
				},
			},
		],
	},
];
