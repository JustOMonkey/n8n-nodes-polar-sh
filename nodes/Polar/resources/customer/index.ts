import type { INodeProperties } from 'n8n-workflow';
import { customerGetAllDescription } from './getAll';
import { customerGetDescription } from './get';
import { customerCreateDescription } from './create';
import { customerUpdateDescription } from './update';
import { customerDeleteDescription } from './delete';
import { customerGetStateDescription } from './getState';
import { customerGetPaymentMethodsDescription } from './getPaymentMethods';

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
				routing: { request: { method: 'POST', url: '=/customers/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a customer',
				description: 'Delete a customer',
				routing: { request: { method: 'DELETE', url: '=/customers/{{$parameter["customerId"]}}' } },
			},
			{
				name: 'Delete by External ID',
				value: 'deleteExternal',
				action: 'Delete a customer by external ID',
				description: "Delete a customer identified by your system's external ID",
				routing: { request: { method: 'DELETE', url: '=/customers/external/{{$parameter["externalCustomerId"]}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a customer',
				description: 'Get a single customer by ID',
				routing: { request: { method: 'GET', url: '=/customers/{{$parameter["customerId"]}}' } },
			},
			{
				name: 'Get by External ID',
				value: 'getExternal',
				action: 'Get a customer by external ID',
				description: "Get a single customer by your system's external ID",
				routing: { request: { method: 'GET', url: '=/customers/external/{{$parameter["externalCustomerId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many customers',
				description: 'Get many customers',
				routing: { request: { method: 'GET', url: '=/customers/' } },
			},
			{
				name: 'Get Payment Methods',
				value: 'getPaymentMethods',
				action: 'Get a customer payment methods',
				description: 'List saved payment methods for a customer',
				routing: { request: { method: 'GET', url: '=/customers/{{$parameter["customerId"]}}/payment-methods' } },
			},
			{
				name: 'Get State',
				value: 'getState',
				action: 'Get a customer state',
				description: 'Get a consolidated view of a customer’s active subscriptions, orders and benefit grants',
				routing: { request: { method: 'GET', url: '=/customers/{{$parameter["customerId"]}}/state' } },
			},
			{
				name: 'Get State by External ID',
				value: 'getStateExternal',
				action: 'Get a customer state by external ID',
				description: "Get a consolidated customer state by your system's external ID",
				routing: { request: { method: 'GET', url: '=/customers/external/{{$parameter["externalCustomerId"]}}/state' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a customer',
				description: 'Update an existing customer',
				routing: { request: { method: 'PATCH', url: '=/customers/{{$parameter["customerId"]}}' } },
			},
			{
				name: 'Update by External ID',
				value: 'updateExternal',
				action: 'Update a customer by external ID',
				description: "Update a customer identified by your system's external ID",
				routing: { request: { method: 'PATCH', url: '=/customers/external/{{$parameter["externalCustomerId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...customerGetAllDescription,
	...customerGetDescription,
	...customerCreateDescription,
	...customerUpdateDescription,
	...customerDeleteDescription,
	...customerGetStateDescription,
	...customerGetPaymentMethodsDescription,
];
