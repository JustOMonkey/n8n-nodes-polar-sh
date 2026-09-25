import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { customerGetAllDescription } from './getAll';
import { customerGetDescription } from './get';
import { customerCreateDescription } from './create';
import { customerUpdateDescription } from './update';
import { customerDeleteDescription } from './delete';
import { customerGetStateDescription } from './getState';
import { customerGetPaymentMethodsDescription } from './getPaymentMethods';
import { csvToBinary } from '../../shared/binary';
import { customerGetPaymentMethodsExternalDescription } from './getPaymentMethodsExternal';

const showOnlyForCustomer = { resource: ['customer'] };

export const customerDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomer },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a customer',
				description: 'Create a new customer',
				routing: {
					request: { method: 'POST', url: '=/customers/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a customer',
				description: 'Delete a customer',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/customers/{{$parameter["customerId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete by External ID',
				value: 'deleteExternal',
				action: 'Delete a customer by external ID',
				description: "Delete a customer identified by your system's external ID",
				routing: {
					request: {
						method: 'DELETE',
						url: '=/customers/external/{{$parameter["externalCustomerId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Export',
				value: 'export',
				action: 'Export customers',
				description: 'Download all customers as a CSV file (binary property "data")',
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/export',
						ignoreHttpStatusErrors: true,
						encoding: 'arraybuffer',
						json: false,
						arrayFormat: 'repeat',
						headers: { Accept: 'text/csv' },
					},
					output: { postReceive: [handlePolarApiError, csvToBinary('customers-export.csv')] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a customer',
				description: 'Get a single customer by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/{{$parameter["customerId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get by External ID',
				value: 'getExternal',
				action: 'Get a customer by external ID',
				description: "Get a single customer by your system's external ID",
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/external/{{$parameter["externalCustomerId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many customers',
				description: 'Get many customers',
				routing: {
					request: { method: 'GET', url: '=/customers/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Payment Methods',
				value: 'getPaymentMethods',
				action: 'Get a customer payment methods',
				description: 'List saved payment methods for a customer',
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/{{$parameter["customerId"]}}/payment-methods',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Payment Methods by External ID',
				value: 'getPaymentMethodsExternal',
				action: 'Get a customer payment methods by external ID',
				description:
					"List saved payment methods for a customer identified by your system's external ID",
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/external/{{$parameter["externalCustomerId"]}}/payment-methods',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get State',
				value: 'getState',
				action: 'Get a customer state',
				description:
					'Get a consolidated view of a customer’s active subscriptions, orders and benefit grants',
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/{{$parameter["customerId"]}}/state',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get State by External ID',
				value: 'getStateExternal',
				action: 'Get a customer state by external ID',
				description: "Get a consolidated customer state by your system's external ID",
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/external/{{$parameter["externalCustomerId"]}}/state',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a customer',
				description: 'Update an existing customer',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/customers/{{$parameter["customerId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update by External ID',
				value: 'updateExternal',
				action: 'Update a customer by external ID',
				description: "Update a customer identified by your system's external ID",
				routing: {
					request: {
						method: 'PATCH',
						url: '=/customers/external/{{$parameter["externalCustomerId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('customer'),
	...customerGetAllDescription,
	...customerGetDescription,
	...customerCreateDescription,
	...customerUpdateDescription,
	...customerDeleteDescription,
	...customerGetStateDescription,
	...customerGetPaymentMethodsDescription,
	...customerGetPaymentMethodsExternalDescription,
];
