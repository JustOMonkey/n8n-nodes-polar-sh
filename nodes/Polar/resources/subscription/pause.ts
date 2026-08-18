import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['pause'] };

export const subscriptionPauseDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Pause at Period End',
		name: 'pauseAtPeriodEnd',
		type: 'boolean',
		default: true,
		required: true,
		displayOptions: { show },
		description: 'Whether to pause at the end of the current period instead of immediately',
		routing: { send: { type: 'body', property: 'pause_at_period_end' } },
	},
	{
		displayName: 'Resumes At',
		name: 'resumesAt',
		type: 'dateTime',
		default: '',
		displayOptions: { show },
		description: 'Optional date to automatically resume the subscription',
		routing: {
			send: {
				type: 'body',
				property: 'resumes_at',
				value: '={{ $value || undefined }}',
			},
		},
	},
];
