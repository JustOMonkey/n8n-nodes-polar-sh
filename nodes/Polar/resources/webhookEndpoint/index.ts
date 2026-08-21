import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { webhookEndpointGetAllDescription } from './getAll';
import { webhookEndpointGetDescription } from './get';
import { webhookEndpointCreateDescription } from './create';
import { webhookEndpointUpdateDescription } from './update';
import { webhookEndpointDeleteDescription } from './delete';
import { webhookEndpointResetSecretDescription } from './resetSecret';

const showOnlyForWebhookEndpoint = { resource: ['webhookEndpoint'] };

export const webhookEndpointDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForWebhookEndpoint },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a webhook endpoint',
				description: 'Create a new webhook endpoint',
				routing: {
					request: { method: 'POST', url: '=/webhooks/endpoints', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a webhook endpoint',
				description: 'Delete a webhook endpoint',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/webhooks/endpoints/{{$parameter["webhookEndpointId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a webhook endpoint',
				description: 'Get a single webhook endpoint by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/endpoints/{{$parameter["webhookEndpointId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many webhook endpoints',
				description: 'Get many webhook endpoints',
				routing: {
					request: { method: 'GET', url: '=/webhooks/endpoints', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Reset Secret',
				value: 'resetSecret',
				action: 'Reset a webhook endpoint secret',
				description:
					'Regenerate a webhook endpoint secret. The previous secret is immediately invalidated.',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/webhooks/endpoints/{{$parameter["webhookEndpointId"]}}/secret',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a webhook endpoint',
				description: 'Update an existing webhook endpoint',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/webhooks/endpoints/{{$parameter["webhookEndpointId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('webhookEndpoint'),
	...webhookEndpointGetAllDescription,
	...webhookEndpointGetDescription,
	...webhookEndpointCreateDescription,
	...webhookEndpointUpdateDescription,
	...webhookEndpointDeleteDescription,
	...webhookEndpointResetSecretDescription,
];
