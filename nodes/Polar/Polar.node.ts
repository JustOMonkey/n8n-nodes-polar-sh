import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { checkoutDescription } from './resources/checkout';
import { checkoutLinkDescription } from './resources/checkoutLink';
import { customerDescription } from './resources/customer';
import { orderDescription } from './resources/order';
import { subscriptionDescription } from './resources/subscription';
import { getProducts } from './listSearch/getProducts';
import { getCustomers } from './listSearch/getCustomers';
import { getProductOptions } from './loadOptions/getProductOptions';

export class Polar implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Polar',
		name: 'polar',
		icon: { light: 'file:../../icons/polar.svg', dark: 'file:../../icons/polar.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume the Polar.sh API',
		defaults: {
			name: 'Polar',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'polarApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL:
				'={{$credentials.environment === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh"}}/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Checkout', value: 'checkout' },
					{ name: 'Checkout Link', value: 'checkoutLink' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Order', value: 'order' },
					{ name: 'Subscription', value: 'subscription' },
				],
				default: 'checkout',
			},
			...checkoutDescription,
			...checkoutLinkDescription,
			...customerDescription,
			...orderDescription,
			...subscriptionDescription,
		],
	};

	methods = {
		listSearch: {
			getProducts,
			getCustomers,
		},
		loadOptions: {
			getProductOptions,
		},
	};
}
