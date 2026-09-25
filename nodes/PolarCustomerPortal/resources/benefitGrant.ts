import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../Polar/shared/descriptions';
import { portalRouting } from '../shared/errorHandling';

const resource = ['benefitGrant'];
const showGetAll = { resource, operation: ['getAll'] };
const showUpdate = { resource, operation: ['update'] };

const benefitTypeOptions = [
	{ name: 'Custom', value: 'custom' },
	{ name: 'Discord', value: 'discord' },
	{ name: 'Downloadables', value: 'downloadables' },
	{ name: 'Feature Flag', value: 'feature_flag' },
	{ name: 'GitHub Repository', value: 'github_repository' },
	{ name: 'License Keys', value: 'license_keys' },
	{ name: 'Meter Credit', value: 'meter_credit' },
	{ name: 'Slack Shared Channel', value: 'slack_shared_channel' },
];

export const benefitGrantDescription: INodeProperties[] = [
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
				action: 'Get a benefit grant',
				description: "Get one of the customer's benefit grants",
				routing: portalRouting('GET', '=/customer-portal/benefit-grants/{{$parameter["benefitGrantId"]}}'),
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many benefit grants',
				description: "List the customer's benefit grants",
				routing: portalRouting('GET', '=/customer-portal/benefit-grants/'),
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a benefit grant',
				description:
					'Connect the account a benefit is delivered to (Discord / GitHub account, Slack invite email)',
				routing: portalRouting('PATCH', '=/customer-portal/benefit-grants/{{$parameter["benefitGrantId"]}}'),
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Benefit Grant ID',
		name: 'benefitGrantId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['get', 'update'] } },
	},
	...paginationProperties(showGetAll),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showGetAll },
		options: [
			{
				displayName: 'Benefit ID',
				name: 'benefit_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { benefit_id: '={{$value}}' } } },
			},
			{
				displayName: 'Benefit Type',
				name: 'type',
				type: 'multiOptions',
				options: benefitTypeOptions,
				default: [],
				routing: { request: { qs: { type: '={{$value}}' }, arrayFormat: 'repeat' } },
			},
			{
				displayName: 'Checkout ID',
				name: 'checkout_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { checkout_id: '={{$value}}' } } },
			},
			{
				displayName: 'Member ID',
				name: 'member_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { member_id: '={{$value}}' } } },
			},
			{
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Free-text search',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Subscription ID',
				name: 'subscription_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { subscription_id: '={{$value}}' } } },
			},
		],
	},
	{
		displayName: 'Benefit Type',
		name: 'benefitType',
		type: 'options',
		options: benefitTypeOptions,
		default: 'discord',
		required: true,
		displayOptions: { show: showUpdate },
		description: "Must match the grant's benefit type",
		routing: { send: { type: 'body', property: 'benefit_type' } },
	},
	{
		displayName: 'Account ID',
		name: 'accountId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { ...showUpdate, benefitType: ['discord', 'github_repository'] } },
		description: "ID of the customer's connected Discord or GitHub account to deliver the benefit to",
		routing: { send: { type: 'body', property: 'properties.account_id' } },
	},
	{
		displayName: 'Invited Email',
		name: 'invitedEmail',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'name@email.com',
		displayOptions: { show: { ...showUpdate, benefitType: ['slack_shared_channel'] } },
		description: 'Email address to invite to the shared Slack channel',
		routing: { send: { type: 'body', property: 'properties.invited_email' } },
	},
];
