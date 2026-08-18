import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['update'] };
const showVisibility = { ...show, benefitType: ['custom', 'license_keys', 'meter_credit', 'feature_flag'] };
const showCustom = { ...show, benefitType: ['custom'] };
const showDiscord = { ...show, benefitType: ['discord'] };
const showGitHub = { ...show, benefitType: ['github_repository'] };
const showDownloadables = { ...show, benefitType: ['downloadables'] };
const showLicenseKeys = { ...show, benefitType: ['license_keys'] };
const showMeterCredit = { ...show, benefitType: ['meter_credit'] };
const showSlack = { ...show, benefitType: ['slack_shared_channel'] };

export const benefitUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Benefit Type',
		name: 'benefitType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		description: 'Must match the benefit\'s existing type — Polar does not support changing a benefit\'s type after creation',
		options: [
			{ name: 'Custom', value: 'custom' },
			{ name: 'Discord', value: 'discord' },
			{ name: 'Downloadables', value: 'downloadables' },
			{ name: 'Feature Flag', value: 'feature_flag' },
			{ name: 'GitHub Repository', value: 'github_repository' },
			{ name: 'License Keys', value: 'license_keys' },
			{ name: 'Meter Credit', value: 'meter_credit' },
			{ name: 'Slack Shared Channel', value: 'slack_shared_channel' },
		],
		default: 'custom',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'description', value: '={{$value || undefined}}' } },
	},
	{
		displayName: 'Visibility',
		name: 'visibility',
		type: 'options',
		options: [
			{ name: 'Do Not Change', value: '' },
			{ name: 'Draft', value: 'draft' },
			{ name: 'Private', value: 'private' },
			{ name: 'Public', value: 'public' },
		],
		default: '',
		displayOptions: { show: showVisibility },
		routing: { send: { type: 'body', property: 'visibility', value: '={{$value || undefined}}' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		required: true,
		displayOptions: { show: showCustom },
		routing: { send: { type: 'body', property: 'properties', value: '={{ { note: $value || null } }}' } },
	},
	{
		displayName: 'Discord Guild Token',
		name: 'guildToken',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		displayOptions: { show: showDiscord },
	},
	{
		displayName: 'Discord Role ID',
		name: 'roleId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showDiscord },
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
				value: '={{ ($value.file && $value.file.length) ? { files: $value.file.map((f) => f.id) } : undefined }}',
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
			{ displayName: 'Activation Limit', name: 'activations_limit', type: 'number', default: 1 },
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
			{ displayName: 'Expires After (TTL)', name: 'expires_ttl', type: 'number', default: 1 },
			{ displayName: 'Key Prefix', name: 'prefix', type: 'string', default: '' },
			{ displayName: 'Usage Limit', name: 'limit_usage', type: 'number', default: 1 },
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
					return Object.keys(properties).length ? properties : undefined;
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
		description: 'Polar replaces the full properties object on update — any of these fields left unset here will revert to their Polar default (Private Channel: true, Archive Channel on Revoke: true) rather than keeping their current value',
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
];
