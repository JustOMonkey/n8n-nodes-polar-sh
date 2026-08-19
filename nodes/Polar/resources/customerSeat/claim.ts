import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['claim'] };

export const customerSeatClaimDescription: INodeProperties[] = [
	{
		displayName: 'Invitation Token',
		name: 'invitationToken',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		displayOptions: { show },
		description:
			'This endpoint requires no authentication on Polar’s side — it is meant for the invited person’s own client, and works regardless of whether the configured credential is valid',
		routing: { send: { type: 'body', property: 'invitation_token' } },
	},
];
