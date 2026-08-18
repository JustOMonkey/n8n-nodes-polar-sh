import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['create'] };
const showCustom = { ...show, benefitType: ['custom'] };
const showDiscord = { ...show, benefitType: ['discord'] };
const showGitHub = { ...show, benefitType: ['github_repository'] };
const showDownloadables = { ...show, benefitType: ['downloadables'] };
const showLicenseKeys = { ...show, benefitType: ['license_keys'] };
const showMeterCredit = { ...show, benefitType: ['meter_credit'] };
const showSlack = { ...show, benefitType: ['slack_shared_channel'] };
const showFeatureFlag = { ...show, benefitType: ['feature_flag'] };

export const benefitCreateDescription: INodeProperties[] = [
	{
		displayName: 'Benefit Type',
		name: 'benefitType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Custom', value: 'custom', description: 'A generic benefit with a private note for the customer' },
			{ name: 'Discord', value: 'discord', description: 'Grants a role in a Discord server' },
			{ name: 'Downloadables', value: 'downloadables', description: 'Grants access to downloadable files' },
			{ name: 'Feature Flag', value: 'feature_flag', description: 'A simple on/off entitlement flag' },
			{ name: 'GitHub Repository', value: 'github_repository', description: 'Grants access to a GitHub repository' },
			{ name: 'License Keys', value: 'license_keys', description: 'Issues a license key' },
			{ name: 'Meter Credit', value: 'meter_credit', description: 'Credits usage-based meter units' },
			{ name: 'Slack Shared Channel', value: 'slack_shared_channel', description: 'Grants access to a Slack Connect shared channel' },
		],
		default: 'custom',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Displayed on products having this benefit',
		routing: { send: { type: 'body', property: 'description' } },
	},
	{
		displayName: 'Visibility',
		name: 'visibility',
		type: 'options',
		options: [
			{ name: 'Draft', value: 'draft' },
			{ name: 'Private', value: 'private' },
			{ name: 'Public', value: 'public' },
		],
		default: 'public',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'visibility' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		displayOptions: { show: showCustom },
		description: 'Private note shared with customers who have this benefit granted',
		routing: {
			send: { type: 'body', property: 'properties', value: '={{ { note: $value || null } }}' },
		},
	},
	{
		displayName: 'Discord Guild Token',
		name: 'guildToken',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		displayOptions: { show: showDiscord },
		description: "The Discord server's bot/integration token used to manage role grants",
	},
	{
		displayName: 'Discord Role ID',
		name: 'roleId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showDiscord },
		description: 'The ID of the Discord role to grant',
	},
	{
		displayName: 'Kick Member on Revocation',
		name: 'kickMember',
		type: 'boolean',
		default: false,
		required: true,
		displayOptions: { show: showDiscord },
		description: 'Whether to kick the member from the Discord server when this benefit is revoked',
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: '={{ { guild_token: $parameter["guildToken"], role_id: $parameter["roleId"], kick_member: $value } }}',
			},
		},
	},
	{
		displayName: 'Repository Owner',
		name: 'repositoryOwner',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showGitHub },
	},
	{
		displayName: 'Repository Name',
		name: 'repositoryName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showGitHub },
	},
	{
		displayName: 'Permission',
		name: 'permission',
		type: 'options',
		options: [
			{ name: 'Admin', value: 'admin' },
			{ name: 'Maintain', value: 'maintain' },
			{ name: 'Pull', value: 'pull' },
			{ name: 'Push', value: 'push' },
			{ name: 'Triage', value: 'triage' },
		],
		default: 'pull',
		required: true,
		displayOptions: { show: showGitHub },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ { repository_owner: $parameter["repositoryOwner"], repository_name: $parameter["repositoryName"], permission: $value } }}',
			},
		},
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add File ID' },
		default: {},
		displayOptions: { show: showDownloadables },
		description: 'IDs of previously-uploaded Polar files to grant access to (at least one required)',
		options: [
			{
				displayName: 'File',
				name: 'file',
				values: [{ displayName: 'File ID', name: 'id', type: 'string', default: '' }],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: '={{ { files: ($value.file || []).map((f) => f.id) } }}',
			},
		},
	},
	{
		displayName: 'License Key Fields',
		name: 'licenseKeyFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showLicenseKeys },
		options: [
			{
				displayName: 'Activation Limit',
				name: 'activations_limit',
				type: 'number',
				default: 1,
			},
			{
				displayName: 'Customer Can Manage Activations',
				name: 'activations_enable_customer_admin',
				type: 'boolean',
				default: false,
				description: 'Whether the customer can view/deactivate their own activations from the customer portal',
			},
			{
				displayName: 'Expiration Timeframe',
				name: 'expires_timeframe',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'year',
			},
			{
				displayName: 'Expires After (TTL)',
				name: 'expires_ttl',
				type: 'number',
				default: 1,
			},
			{ displayName: 'Key Prefix', name: 'prefix', type: 'string', default: '' },
			{
				displayName: 'Usage Limit',
				name: 'limit_usage',
				type: 'number',
				default: 1,
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: `={{ (() => {
					const v = $value;
					const properties = {};
					if (v.prefix) properties.prefix = v.prefix;
					if (v.expires_ttl && v.expires_timeframe) {
						properties.expires = { ttl: v.expires_ttl, timeframe: v.expires_timeframe };
					}
					if (v.activations_limit) {
						properties.activations = {
							limit: v.activations_limit,
							enable_customer_admin: !!v.activations_enable_customer_admin,
						};
					}
					if (v.limit_usage) properties.limit_usage = v.limit_usage;
					return properties;
				})() }}`,
			},
		},
	},
	{
		displayName: 'Units',
		name: 'meterUnits',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show: showMeterCredit },
		description: 'Number of meter units to credit',
	},
	{
		displayName: 'Rollover',
		name: 'meterRollover',
		type: 'boolean',
		default: false,
		required: true,
		displayOptions: { show: showMeterCredit },
		description: "Whether unused credited units roll over to the customer's next billing period",
	},
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showMeterCredit },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ { units: $parameter["meterUnits"], rollover: $parameter["meterRollover"], meter_id: $value } }}',
			},
		},
	},
	{
		displayName: 'Slack Integration ID',
		name: 'slackIntegrationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showSlack },
		description: 'The Polar Slack integration to use for this benefit',
	},
	{
		displayName: 'Channel Name Template',
		name: 'channelNameTemplate',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showSlack },
	},
	{
		displayName: 'Slack Channel Additional Fields',
		name: 'slackAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showSlack },
		options: [
			{ displayName: 'Private Channel', name: 'private', type: 'boolean', default: true },
			{ displayName: 'Welcome Message', name: 'welcome_message', type: 'string', default: '' },
			{ displayName: 'Archive Channel on Revoke', name: 'archive_on_revoke', type: 'boolean', default: true },
			{
				displayName: 'Team Invitees',
				name: 'team_invitees',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Invitee' },
				default: {},
				options: [
					{
						displayName: 'Invitee',
						name: 'invitee',
						values: [{ displayName: 'Team Member Email or ID', name: 'value', type: 'string', default: '' }],
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: `={{ (() => {
					const v = $value;
					const properties = {
						slack_integration_id: $parameter["slackIntegrationId"],
						channel_name_template: $parameter["channelNameTemplate"],
					};
					if (v.private !== undefined) properties.private = v.private;
					if (v.welcome_message) properties.welcome_message = v.welcome_message;
					if (v.archive_on_revoke !== undefined) properties.archive_on_revoke = v.archive_on_revoke;
					if (v.team_invitees && v.team_invitees.invitee && v.team_invitees.invitee.length) {
						properties.team_invitees = v.team_invitees.invitee.map((i) => i.value);
					}
					return properties;
				})() }}`,
			},
		},
	},
	{
		displayName: 'Feature Flag Properties',
		name: 'featureFlagProperties',
		type: 'hidden',
		default: {},
		displayOptions: { show: showFeatureFlag },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: '={{ ({}) }}',
			},
		},
	},
];
