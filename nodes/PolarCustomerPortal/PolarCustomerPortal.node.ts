import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { addCustomerSessionToken } from './shared/auth';
import { benefitGrantDescription } from './resources/benefitGrant';
import { customerDescription } from './resources/customer';
import { customerMeterDescription } from './resources/customerMeter';
import { downloadableDescription } from './resources/downloadable';
import { licenseKeyDescription } from './resources/licenseKey';
import { memberDescription } from './resources/member';
import { orderDescription } from './resources/order';
import { organizationDescription } from './resources/organization';
import { paymentMethodDescription } from './resources/paymentMethod';
import { seatDescription } from './resources/seat';
import { sessionDescription } from './resources/session';
import { subscriptionDescription } from './resources/subscription';
import { walletDescription } from './resources/wallet';

export class PolarCustomerPortal implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Polar Customer Portal',
		name: 'polarCustomerPortal',
		icon: { light: 'file:../../icons/polar.svg', dark: 'file:../../icons/polar.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			"Act on behalf of one Polar customer (their orders, subscriptions, payment methods, license keys…) with a customer session token",
		defaults: {
			name: 'Polar Customer Portal',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		requestDefaults: {
			baseURL:
				'={{$parameter["environment"] === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh"}}/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Environment',
				name: 'environment',
				type: 'options',
				options: [
					{ name: 'Production', value: 'production' },
					{ name: 'Sandbox', value: 'sandbox' },
				],
				default: 'production',
				description: 'Must match the environment the customer session was created in',
			},
			{
				displayName: 'Customer Session Token',
				name: 'customerSessionToken',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description:
					'Short-lived token from the Polar node (Customer Session → Create), usually passed in with an expression pointing at the token field of that node output. Not needed for the public operations (License Key Activate/Deactivate/Validate, Organization Get, Customer Check/Verify Email Change).',
				routing: { send: { preSend: [addCustomerSessionToken] } },
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Benefit Grant', value: 'benefitGrant' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Customer Meter', value: 'customerMeter' },
					{ name: 'Downloadable', value: 'downloadable' },
					{ name: 'License Key', value: 'licenseKey' },
					{ name: 'Member', value: 'member' },
					{ name: 'Order', value: 'order' },
					{ name: 'Organization', value: 'organization' },
					{ name: 'Payment Method', value: 'paymentMethod' },
					{ name: 'Seat', value: 'seat' },
					{ name: 'Session', value: 'session' },
					{ name: 'Subscription', value: 'subscription' },
					{ name: 'Wallet', value: 'wallet' },
				],
				default: 'subscription',
			},
			...benefitGrantDescription,
			...customerDescription,
			...customerMeterDescription,
			...downloadableDescription,
			...licenseKeyDescription,
			...memberDescription,
			...orderDescription,
			...organizationDescription,
			...paymentMethodDescription,
			...seatDescription,
			...sessionDescription,
			...subscriptionDescription,
			...walletDescription,
		],
	};
}
