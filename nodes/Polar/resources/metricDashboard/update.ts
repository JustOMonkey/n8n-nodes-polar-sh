import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['metricDashboard'], operation: ['update'] };

export const metricDashboardUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Update Fields',
		name: 'updateFields',
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
				description: 'Comma-separated metric slugs to display (max 10). Replaces the current list.',
				routing: {
					request: {
						body: {
							metrics:
								'={{ (Array.isArray($value) ? $value : String($value).split(",")).map(s => String(s).trim()).filter(s => s) }}',
						},
					},
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
		],
	},
];
