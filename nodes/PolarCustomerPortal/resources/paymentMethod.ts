import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../Polar/shared/descriptions';
import { portalRouting } from '../shared/errorHandling';

const resource = ['paymentMethod'];

export const paymentMethodDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Add',
				value: 'add',
				action: 'Add a payment method',
				description: 'Save a new payment method from a Stripe confirmation token',
				routing: portalRouting('POST', '=/customer-portal/customers/me/payment-methods'),
			},
			{
				name: 'Confirm',
				value: 'confirm',
				action: 'Confirm a payment method',
				description: 'Finish saving a payment method that required extra authentication (Stripe setup intent)',
				routing: portalRouting('POST', '=/customer-portal/customers/me/payment-methods/confirm'),
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a payment method',
				description: 'Remove a saved payment method',
				routing: portalRouting(
					'DELETE',
					'=/customer-portal/customers/me/payment-methods/{{$parameter["paymentMethodId"]}}',
				),
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many payment methods',
				description: "List the customer's saved payment methods",
				routing: portalRouting('GET', '=/customer-portal/customers/me/payment-methods'),
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Payment Method ID',
		name: 'paymentMethodId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['delete'] } },
	},
	...paginationProperties({ resource, operation: ['getAll'] }),
	{
		displayName: 'Confirmation Token ID',
		name: 'confirmationTokenId',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['add'] } },
		description: 'Stripe confirmation token ID created by Stripe.js on the client',
		routing: { send: { type: 'body', property: 'confirmation_token_id' } },
	},
	{
		displayName: 'Return URL',
		name: 'returnUrl',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['add'] } },
		description: 'Where to send the customer back to after any extra authentication step',
		routing: { send: { type: 'body', property: 'return_url' } },
	},
	{
		displayName: 'Setup Intent ID',
		name: 'setupIntentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['confirm'] } },
		description: 'Stripe setup intent ID returned when the payment method needed extra authentication',
		routing: { send: { type: 'body', property: 'setup_intent_id' } },
	},
	{
		displayName: 'Set as Default',
		name: 'setDefault',
		type: 'boolean',
		default: false,
		required: true,
		displayOptions: { show: { resource, operation: ['add', 'confirm'] } },
		description: "Whether to make this the customer's default payment method",
		routing: { send: { type: 'body', property: 'set_default' } },
	},
];
