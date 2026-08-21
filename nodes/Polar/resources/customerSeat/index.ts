import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { customerSeatGetAllDescription } from './getAll';
import { customerSeatAssignDescription } from './assign';
import { customerSeatRevokeDescription } from './revoke';
import { customerSeatResendInvitationDescription } from './resendInvitation';
import { customerSeatGetClaimInfoDescription } from './getClaimInfo';
import { customerSeatClaimDescription } from './claim';

const showOnlyForCustomerSeat = { resource: ['customerSeat'] };

export const customerSeatDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomerSeat },
		options: [
			{
				name: 'Assign Seat',
				value: 'assign',
				action: 'Assign a seat',
				description: 'Assign a seat to a customer or member',
				routing: {
					request: { method: 'POST', url: '=/customer-seats', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Claim Seat',
				value: 'claim',
				action: 'Claim a seat',
				description: 'Claim a seat using an invitation token (no authentication required)',
				routing: {
					request: { method: 'POST', url: '=/customer-seats/claim', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Claim Info',
				value: 'getClaimInfo',
				action: 'Get seat claim info',
				description:
					'Get read-only information about a seat claim invitation (no authentication required)',
				routing: {
					request: {
						method: 'GET',
						url: '=/customer-seats/claim/{{$parameter["invitationToken"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many seats',
				description: 'List seats for a subscription or order',
				routing: {
					request: { method: 'GET', url: '=/customer-seats', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Resend Invitation',
				value: 'resendInvitation',
				action: 'Resend a seat invitation',
				description: 'Resend the invitation email for a pending seat',
				routing: {
					request: {
						method: 'POST',
						url: '=/customer-seats/{{$parameter["seatId"]}}/resend',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Revoke Seat',
				value: 'revoke',
				action: 'Revoke a seat',
				description: 'Revoke an assigned or pending seat',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/customer-seats/{{$parameter["seatId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('customerSeat'),
	...customerSeatGetAllDescription,
	...customerSeatAssignDescription,
	...customerSeatRevokeDescription,
	...customerSeatResendInvitationDescription,
	...customerSeatGetClaimInfoDescription,
	...customerSeatClaimDescription,
];
