import type { INodeProperties } from 'n8n-workflow';
import { csvToBinary } from '../../shared/binary';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { metricQueryProperties } from './query';

const showOnlyForMetric = { resource: ['metric'] };

export const metricDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMetric },
		options: [
			{
				name: 'Export',
				value: 'export',
				action: 'Export metrics',
				description: 'Download metrics over a period as a CSV file (binary property "data")',
				routing: {
					request: {
						method: 'GET',
						url: '=/metrics/export',
						ignoreHttpStatusErrors: true,
						encoding: 'arraybuffer',
						json: false,
						arrayFormat: 'repeat',
						headers: { Accept: 'text/csv' },
					},
					output: { postReceive: [handlePolarApiError, csvToBinary('metrics-export.csv')] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get metrics',
				description: 'Get revenue, order and subscription metrics over a period',
				routing: {
					request: { method: 'GET', url: '=/metrics/', ignoreHttpStatusErrors: true, arrayFormat: 'repeat' },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Limits',
				value: 'getLimits',
				action: 'Get metrics limits',
				description: 'Get the allowed date range and intervals for metrics queries',
				routing: {
					request: { method: 'GET', url: '=/metrics/limits', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'get',
	},
	...scopeNoticesForResource('metric'),
	...metricQueryProperties,
];
