import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../Polar/shared/descriptions';
import { portalRouting } from '../shared/errorHandling';

const resource = ['wallet'];

export const walletDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a wallet',
				description: "Get one of the customer's wallets and its balance",
				routing: portalRouting('GET', '=/customer-portal/wallets/{{$parameter["walletId"]}}'),
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many wallets',
				description: "List the customer's wallets",
				routing: portalRouting('GET', '=/customer-portal/wallets/'),
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Wallet ID',
		name: 'walletId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['get'] } },
	},
	...paginationProperties({ resource, operation: ['getAll'] }),
];
