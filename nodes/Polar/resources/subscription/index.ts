import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { subscriptionGetAllDescription } from './getAll';
import { subscriptionGetDescription } from './get';
import { subscriptionCreateDescription } from './create';
import { subscriptionUpdateDescription } from './update';
import { subscriptionUpdateSeatsDescription } from './updateSeats';
import { subscriptionUpdateBillingPeriodDescription } from './updateBillingPeriod';
import { subscriptionCancelDescription } from './cancel';
import { subscriptionRevokeDescription } from './revoke';
import { subscriptionPauseDescription } from './pause';
import { subscriptionResumeDescription } from './resume';
import { subscriptionClearPendingUpdateDescription } from './clearPendingUpdate';

const showOnlyForSubscription = { resource: ['subscription'] };

export const subscriptionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForSubscription },
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel a subscription',
				description: 'Schedule (or un-schedule) cancellation at the end of the current period',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Clear Pending Update',
				value: 'clearPendingUpdate',
				action: 'Clear a pending subscription update',
				description: 'Clear any scheduled change on the subscription',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a subscription',
				description: 'Create a free subscription directly, without a checkout',
				routing: {
					request: { method: 'POST', url: '=/subscriptions/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a subscription',
				description: 'Get a single subscription by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many subscriptions',
				description: 'Get many subscriptions',
				routing: {
					request: { method: 'GET', url: '=/subscriptions/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Pause',
				value: 'pause',
				action: 'Pause a subscription',
				description: 'Pause an active subscription',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Resume',
				value: 'resume',
				action: 'Resume a subscription',
				description: 'Resume a paused subscription immediately',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Revoke',
				value: 'revoke',
				action: 'Revoke a subscription',
				description: 'Cancel and revoke a subscription immediately',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a subscription',
				description: 'Change the product, discount, trial end, or proration behavior',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update Billing Period',
				value: 'updateBillingPeriod',
				action: 'Update subscription billing period',
				description: 'Move the end date of the current billing period',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update Seats',
				value: 'updateSeats',
				action: 'Update subscription seats',
				description: 'Change the number of seats on a seat-based subscription',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/subscriptions/{{$parameter["subscriptionId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('subscription'),
	...subscriptionGetAllDescription,
	...subscriptionGetDescription,
	...subscriptionCreateDescription,
	...subscriptionUpdateDescription,
	...subscriptionUpdateSeatsDescription,
	...subscriptionUpdateBillingPeriodDescription,
	...subscriptionCancelDescription,
	...subscriptionRevokeDescription,
	...subscriptionPauseDescription,
	...subscriptionResumeDescription,
	...subscriptionClearPendingUpdateDescription,
];
