import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['revoke'] };

export const customerSeatRevokeDescription: INodeProperties[] = [
	{
		displayName: 'Seat ID',
		name: 'seatId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
