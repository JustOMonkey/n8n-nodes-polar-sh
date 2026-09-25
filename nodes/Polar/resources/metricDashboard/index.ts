import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { metricDashboardIdProperty } from './get';
import { metricDashboardCreateDescription } from './create';
import { metricDashboardUpdateDescription } from './update';

const showOnlyForMetricDashboard = { resource: ['metricDashboard'] };
const byId = '=/metrics/dashboards/{{$parameter["metricDashboardId"]}}';

export const metricDashboardDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMetricDashboard },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a metric dashboard',
				description: 'Create a custom metrics dashboard',
				routing: {
					request: { method: 'POST', url: '=/metrics/dashboards', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a metric dashboard',
				description: 'Delete a custom metrics dashboard',
				routing: {
					request: { method: 'DELETE', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a metric dashboard',
				description: 'Get a single metrics dashboard by ID',
				routing: {
					request: { method: 'GET', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many metric dashboards',
				description: 'List many custom metrics dashboards',
				routing: {
					request: { method: 'GET', url: '=/metrics/dashboards', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a metric dashboard',
				description: "Rename a dashboard or change its metrics",
				routing: {
					request: { method: 'PATCH', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('metricDashboard'),
	metricDashboardIdProperty,
	...metricDashboardCreateDescription,
	...metricDashboardUpdateDescription,
];
