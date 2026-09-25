import type { INodeProperties } from 'n8n-workflow';

export const metricDashboardIdProperty: INodeProperties = {
	displayName: 'Metric Dashboard ID',
	name: 'metricDashboardId',
	type: 'string',
	default: '',
	required: true,
	displayOptions: { show: { resource: ['metricDashboard'], operation: ['delete', 'get', 'update'] } },
};
