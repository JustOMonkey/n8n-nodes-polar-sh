import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { orderGetAllDescription } from './getAll';
import { orderGetDescription } from './get';
import { orderCreateDescription } from './create';
import { orderUpdateDescription } from './update';
import { orderFinalizeDescription } from './finalize';
import { orderGenerateInvoiceDescription } from './generateInvoice';
import { orderGetInvoiceDescription } from './getInvoice';
import { orderGetReceiptDescription } from './getReceipt';

const showOnlyForOrder = { resource: ['order'] };

export const orderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForOrder },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an order',
				description: 'Create a manual order for a free or fixed-price one-time product',
				routing: {
					request: { method: 'POST', url: '=/orders/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Finalize',
				value: 'finalize',
				action: 'Finalize an order',
				description: 'Finalize a draft order and trigger an off-session charge',
				routing: {
					request: {
						method: 'POST',
						url: '=/orders/{{$parameter["orderId"]}}/finalize',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Generate Invoice',
				value: 'generateInvoice',
				action: 'Generate an order invoice',
				description: 'Trigger generation of an invoice for this order',
				routing: {
					request: {
						method: 'POST',
						url: '=/orders/{{$parameter["orderId"]}}/invoice',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an order',
				description: 'Get a single order by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/orders/{{$parameter["orderId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Invoice',
				value: 'getInvoice',
				action: 'Get an order invoice',
				description: 'Get the generated invoice details/URL for an order',
				routing: {
					request: {
						method: 'GET',
						url: '=/orders/{{$parameter["orderId"]}}/invoice',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many orders',
				description: 'Get many orders',
				routing: {
					request: { method: 'GET', url: '=/orders/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Receipt',
				value: 'getReceipt',
				action: 'Get an order receipt',
				description: 'Get the receipt URL for a paid order',
				routing: {
					request: {
						method: 'GET',
						url: '=/orders/{{$parameter["orderId"]}}/receipt',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an order',
				description: "Update an order's billing name/address",
				routing: {
					request: {
						method: 'PATCH',
						url: '=/orders/{{$parameter["orderId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('order'),
	...orderGetAllDescription,
	...orderGetDescription,
	...orderCreateDescription,
	...orderUpdateDescription,
	...orderFinalizeDescription,
	...orderGenerateInvoiceDescription,
	...orderGetInvoiceDescription,
	...orderGetReceiptDescription,
];
