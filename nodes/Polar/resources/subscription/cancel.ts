import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['cancel'] };

export const subscriptionCancelDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Cancel at Period End',
		name: 'cancelAtPeriodEnd',
		type: 'boolean',
		default: true,
		required: true,
		displayOptions: { show },
		description: 'Whether to schedule cancellation at the end of the current billing period (set to false to un-cancel a scheduled cancellation)',
		routing: { send: { type: 'body', property: 'cancel_at_period_end' } },
	},
	{
		displayName: 'Cancellation Reason',
		name: 'customerCancellationReason',
		type: 'options',
		options: [
			{ name: 'Customer Service', value: 'customer_service' },
			{ name: 'Low Quality', value: 'low_quality' },
			{ name: 'Missing Features', value: 'missing_features' },
			{ name: 'Other', value: 'other' },
			{ name: 'Switched Service', value: 'switched_service' },
			{ name: 'Too Complex', value: 'too_complex' },
			{ name: 'Too Expensive', value: 'too_expensive' },
			{ name: 'Unused', value: 'unused' },
		],
		default: 'other',
		displayOptions: { show },
		routing: {
			send: {
				type: 'body',
				property: 'customer_cancellation_reason',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Cancellation Comment',
		name: 'customerCancellationComment',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: {
			send: {
				type: 'body',
				property: 'customer_cancellation_comment',
				value: '={{ $value || undefined }}',
			},
		},
	},
];
