import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { benefitDescription } from './resources/benefit';
import { benefitGrantDescription } from './resources/benefitGrant';
import { checkoutDescription } from './resources/checkout';
import { checkoutLinkDescription } from './resources/checkoutLink';
import { customFieldDescription } from './resources/customField';
import { customerDescription } from './resources/customer';
import { customerMeterDescription } from './resources/customerMeter';
import { customerSeatDescription } from './resources/customerSeat';
import { customerSessionDescription } from './resources/customerSession';
import { discountDescription } from './resources/discount';
import { disputeDescription } from './resources/dispute';
import { eventDescription } from './resources/event';
import { eventTypeDescription } from './resources/eventType';
import { fileDescription } from './resources/file';
import { licenseKeyDescription } from './resources/licenseKey';
import { meterDescription } from './resources/meter';
import { orderDescription } from './resources/order';
import { productDescription } from './resources/product';
import { refundDescription } from './resources/refund';
import { subscriptionDescription } from './resources/subscription';
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
					{ name: 'Custom Field', value: 'customField' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Customer Meter', value: 'customerMeter' },
					{ name: 'Customer Seat', value: 'customerSeat' },
					{ name: 'Customer Session', value: 'customerSession' },
					{ name: 'Discount', value: 'discount' },
					{ name: 'Dispute', value: 'dispute' },
					{ name: 'Event', value: 'event' },
					{ name: 'Event Type', value: 'eventType' },
					{ name: 'File', value: 'file' },
					{ name: 'License Key', value: 'licenseKey' },
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
			...customFieldDescription,
			...customerDescription,
			...customerMeterDescription,
			...customerSeatDescription,
			...customerSessionDescription,
			...discountDescription,
			...disputeDescription,
			...eventDescription,
			...eventTypeDescription,
			...fileDescription,
			...licenseKeyDescription,
			...meterDescription,
			...orderDescription,
			...productDescription,
			...refundDescription,
			...subscriptionDescription,
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
