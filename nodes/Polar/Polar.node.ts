import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { benefitDescription } from './resources/benefit';
import { benefitGrantDescription } from './resources/benefitGrant';
import { checkoutDescription } from './resources/checkout';
import { checkoutLinkDescription } from './resources/checkoutLink';
import { customerDescription } from './resources/customer';
import { customerMeterDescription } from './resources/customerMeter';
import { discountDescription } from './resources/discount';
import { disputeDescription } from './resources/dispute';
import { eventDescription } from './resources/event';
import { eventTypeDescription } from './resources/eventType';
import { meterDescription } from './resources/meter';
import { orderDescription } from './resources/order';
import { productDescription } from './resources/product';
import { subscriptionDescription } from './resources/subscription';
import { refundDescription } from './resources/refund';
import { getProducts } from './listSearch/getProducts';
import { getCustomers } from './listSearch/getCustomers';
import { getBenefits } from './listSearch/getBenefits';
import { getProductOptions } from './loadOptions/getProductOptions';
import { getBenefitOptions } from './loadOptions/getBenefitOptions';

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
					{ name: 'Benefit', value: 'benefit' },
					{ name: 'Benefit Grant', value: 'benefitGrant' },
					{ name: 'Checkout', value: 'checkout' },
					{ name: 'Checkout Link', value: 'checkoutLink' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Customer Meter', value: 'customerMeter' },
					{ name: 'Discount', value: 'discount' },
					{ name: 'Dispute', value: 'dispute' },
					{ name: 'Event', value: 'event' },
					{ name: 'Event Type', value: 'eventType' },
					{ name: 'Meter', value: 'meter' },
					{ name: 'Order', value: 'order' },
					{ name: 'Product', value: 'product' },
					{ name: 'Refund', value: 'refund' },
					{ name: 'Subscription', value: 'subscription' },
				],
				default: 'checkout',
			},
			...benefitDescription,
			...benefitGrantDescription,
			...checkoutDescription,
			...checkoutLinkDescription,
			...customerDescription,
			...customerMeterDescription,
			...discountDescription,
			...disputeDescription,
			...eventDescription,
			...eventTypeDescription,
			...meterDescription,
			...orderDescription,
			...productDescription,
			...subscriptionDescription,
			...refundDescription,
		],
	};

	methods = {
		listSearch: {
			getProducts,
			getCustomers,
			getBenefits,
		},
		loadOptions: {
			getProductOptions,
			getBenefitOptions,
		},
	};
}
