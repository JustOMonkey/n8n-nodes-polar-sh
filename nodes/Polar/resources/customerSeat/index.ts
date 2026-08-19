import type { INodeProperties } from 'n8n-workflow';
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
				routing: { request: { method: 'POST', url: '=/customer-seats' } },
			},
			{
				name: 'Claim Seat',
				value: 'claim',
				action: 'Claim a seat',
				description: 'Claim a seat using an invitation token (no authentication required)',
				routing: { request: { method: 'POST', url: '=/customer-seats/claim' } },
			},
			{
				name: 'Get Claim Info',
				value: 'getClaimInfo',
				action: 'Get seat claim info',
				description: 'Get read-only information about a seat claim invitation (no authentication required)',
				routing: { request: { method: 'GET', url: '=/customer-seats/claim/{{$parameter["invitationToken"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many seats',
				description: 'List seats for a subscription or order',
				routing: { request: { method: 'GET', url: '=/customer-seats' } },
			},
			{
				name: 'Resend Invitation',
				value: 'resendInvitation',
				action: 'Resend a seat invitation',
				description: 'Resend the invitation email for a pending seat',
				routing: { request: { method: 'POST', url: '=/customer-seats/{{$parameter["seatId"]}}/resend' } },
			},
			{
				name: 'Revoke Seat',
				value: 'revoke',
				action: 'Revoke a seat',
				description: 'Revoke an assigned or pending seat',
				routing: { request: { method: 'DELETE', url: '=/customer-seats/{{$parameter["seatId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...customerSeatGetAllDescription,
	...customerSeatAssignDescription,
	...customerSeatRevokeDescription,
	...customerSeatResendInvitationDescription,
	...customerSeatGetClaimInfoDescription,
	...customerSeatClaimDescription,
];
