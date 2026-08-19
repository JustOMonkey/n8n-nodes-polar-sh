import type { IDisplayOptions, INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { nextPageInfo } from './utils';

// Every helper below receives a "show" condition map — the value that goes into
// `displayOptions.show` (e.g. `{ resource: ['product'], operation: ['create'] }`) — not a full
// `IDisplayOptions` wrapper (which itself has separate `show`/`hide`/`showOnDeployment` fields).
// `NonNullable<IDisplayOptions['show']>` is the correct type for that condition map.
type ShowCondition = NonNullable<IDisplayOptions['show']>;

const countryCodes = [
	'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
	'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
	'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
	'CO', 'CR', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG',
	'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG',
	'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN',
	'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP',
	'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR',
	'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN',
	'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF',
	'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL',
	'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RW', 'SA', 'SB', 'SC', 'SD',
	'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SZ',
	'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
	'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE',
	'YT', 'ZA', 'ZM', 'ZW',
];

// Polar's OpenAPI spec only exposes ISO 3166-1 alpha-2 codes for this enum, with no
// human-readable country names in the schema, so code is used as both name and value.
export const countryOptions: INodePropertyOptions[] = countryCodes.map((code) => ({
	name: code,
	value: code,
}));

const currencyCodes = [
	'aed', 'all', 'amd', 'aoa', 'ars', 'aud', 'awg', 'azn', 'bam', 'bbd', 'bdt', 'bif', 'bmd', 'bnd',
	'bob', 'brl', 'bsd', 'bwp', 'bzd', 'cad', 'cdf', 'chf', 'clp', 'cny', 'cop', 'crc', 'cve', 'czk',
	'djf', 'dkk', 'dop', 'dzd', 'egp', 'etb', 'eur', 'fjd', 'fkp', 'gbp', 'gel', 'gip', 'gmd', 'gnf',
	'gtq', 'gyd', 'hkd', 'hnl', 'htg', 'huf', 'idr', 'ils', 'inr', 'isk', 'jmd', 'jpy', 'kes', 'kgs',
	'khr', 'kmf', 'krw', 'kyd', 'kzt', 'lak', 'lkr', 'lrd', 'lsl', 'mad', 'mdl', 'mga', 'mkd', 'mnt',
	'mop', 'mur', 'mvr', 'mwk', 'mxn', 'myr', 'mzn', 'nad', 'ngn', 'nio', 'nok', 'npr', 'nzd', 'pab',
	'pen', 'pgk', 'php', 'pkr', 'pln', 'pyg', 'qar', 'ron', 'rsd', 'rwf', 'sar', 'sbd', 'scr', 'sek',
	'sgd', 'shp', 'sos', 'srd', 'szl', 'thb', 'tjs', 'top', 'try', 'ttd', 'twd', 'tzs', 'uah', 'ugx',
	'usd', 'uyu', 'uzs', 'vnd', 'vuv', 'wst', 'xaf', 'xcd', 'xcg', 'xof', 'xpf', 'yer', 'zar', 'zmw',
];

// Same rationale as countryOptions: the spec exposes lowercase ISO 4217 codes only.
export const currencyOptions: INodePropertyOptions[] = currencyCodes.map((code) => ({
	name: code,
	value: code,
}));

export function billingAddressField(
	name: string,
	bodyProperty: string,
	show: ShowCondition,
): INodeProperties {
	return {
		displayName: 'Billing Address',
		name,
		type: 'collection',
		placeholder: 'Add Address Field',
		default: {},
		displayOptions: { show },
		description:
			'Country is required by Polar if any billing address field is set. Leave all fields empty to omit the billing address entirely.',
		options: [
			{ displayName: 'City', name: 'city', type: 'string', default: '' },
			{
				displayName: 'Country (ISO 3166-1 Alpha-2)',
				name: 'country',
				type: 'options',
				options: countryOptions,
				default: 'US',
			},
			{ displayName: 'Line 1', name: 'line1', type: 'string', default: '' },
			{ displayName: 'Line 2', name: 'line2', type: 'string', default: '' },
			{ displayName: 'Postal Code', name: 'postal_code', type: 'string', default: '' },
			{ displayName: 'State', name: 'state', type: 'string', default: '' },
		],
		routing: {
			send: {
				type: 'body',
				property: bodyProperty,
				value: '={{ Object.keys($value).length ? $value : undefined }}',
			},
		},
	};
}

export function metadataField(
	fieldName: string,
	bodyProperty: string,
	displayName: string,
	show: ShowCondition,
): INodeProperties {
	return {
		displayName,
		name: fieldName,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Metadata Field' },
		default: {},
		displayOptions: { show },
		description:
			'Key-value pairs to store additional information (max 50 pairs, key max 40 characters, string value max 500 characters)',
		options: [
			{
				displayName: 'Field',
				name: 'field',
				values: [
					{ displayName: 'Key', name: 'key', type: 'string', default: '' },
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: bodyProperty,
				value:
						'={{ $value.field && $value.field.length ? Object.fromEntries($value.field.map((f) => [f.key, f.value])) : undefined }}',
			},
		},
	};
}

export function typedMetadataField(
	fieldName: string,
	bodyProperty: string,
	displayName: string,
	show: ShowCondition,
): INodeProperties {
	return {
		displayName,
		name: fieldName,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Field' },
		default: {},
		displayOptions: { show },
		description:
			'Key-value pairs to store additional information (max 50 pairs, key max 40 characters, string value max 500 characters). Values are stored as text by default; use a number- or boolean-looking value to store it as a real number or boolean.',
		options: [
			{
				displayName: 'Field',
				name: 'field',
				values: [
					{ displayName: 'Key', name: 'key', type: 'string', default: '' },
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: bodyProperty,
				value:
					'={{ $value.field && $value.field.length ? Object.fromEntries($value.field.map((f) => [f.key, (f.value === "true" ? true : (f.value === "false" ? false : (f.value !== "" && !isNaN(Number(f.value)) ? Number(f.value) : f.value)))])) : undefined }}',
			},
		},
	};
}

export function paginationProperties(show: ShowCondition): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			displayOptions: { show },
			description: 'Whether to return all results or only up to a given limit',
			routing: {
				send: {
					paginate: '={{$value}}',
					type: 'query',
					property: 'limit',
					value: '100',
				},
				operations: {
					pagination: {
						type: 'generic',
						properties: {
							continue: `={{ !!(${nextPageInfo.toString()})($request.url, $response.body.pagination.max_page).next }}`,
							request: {
								url: `={{ (${nextPageInfo.toString()})($request.url, $response.body.pagination.max_page).next ?? $request.url }}`,
							},
						},
					},
				},
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1, maxValue: 100 },
			displayOptions: { show: { ...show, returnAll: [false] } },
			description: 'Max number of results to return',
			routing: { send: { type: 'query', property: 'limit' } },
		},
	];
}

export function customerLocator(show: ShowCondition, required = true): INodeProperties {
	return {
		displayName: 'Customer',
		name: 'customer',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required,
		displayOptions: { show },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a customer...',
				typeOptions: { searchListMethod: 'getCustomers', searchable: true },
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 8b32e60d-6b7b-4a1f-9c9a-2b0f6a2b8f21',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
							errorMessage: 'Not a valid Customer ID (expected a UUID)',
						},
					},
				],
			},
		],
	};
}

export function productLocator(
	paramName: string,
	displayName: string,
	show: ShowCondition,
	required = true,
): INodeProperties {
	return {
		displayName,
		name: paramName,
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required,
		displayOptions: { show },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a product...',
				typeOptions: { searchListMethod: 'getProducts', searchable: true },
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 8b32e60d-6b7b-4a1f-9c9a-2b0f6a2b8f21',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
							errorMessage: 'Not a valid Product ID (expected a UUID)',
						},
					},
				],
			},
		],
	};
}
