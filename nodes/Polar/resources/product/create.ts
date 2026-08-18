import type { INodeProperties } from 'n8n-workflow';
import { currencyOptions, metadataField } from '../../shared/descriptions';

const show = { resource: ['product'], operation: ['create'] };
const showRecurring = { ...show, billingType: ['recurring'] };

type PriceGroupValue = {
	fixedPrice?: Array<{ currency?: string; tax_behavior?: string; price_amount: number }>;
	customPrice?: Array<{
		currency?: string;
		tax_behavior?: string;
		minimum_amount?: number;
		maximum_amount?: number;
		preset_amount?: number;
	}>;
	seatBasedPrice?: Array<{
		currency?: string;
		tax_behavior?: string;
		seat_tier_type?: string;
		seatTiers?: { tier?: Array<{ min_seats: number; max_seats?: number; price_per_seat: number }> };
	}>;
	meteredPrice?: Array<{ currency?: string; tax_behavior?: string; meter_id: string; unit_amount: string; cap_amount?: number }>;
};

function buildPricesArray(v: PriceGroupValue) {
	const fixed = (v.fixedPrice || []).map((p) => ({
		amount_type: 'fixed',
		price_currency: p.currency,
		tax_behavior: p.tax_behavior || undefined,
		price_amount: p.price_amount,
	}));
	const custom = (v.customPrice || []).map((p) => ({
		amount_type: 'custom',
		price_currency: p.currency,
		tax_behavior: p.tax_behavior || undefined,
		minimum_amount: p.minimum_amount,
		maximum_amount: p.maximum_amount || undefined,
		preset_amount: p.preset_amount || undefined,
	}));
	const seatBased = (v.seatBasedPrice || []).map((p) => ({
		amount_type: 'seat_based',
		price_currency: p.currency,
		tax_behavior: p.tax_behavior || undefined,
		seat_tiers: {
			seat_tier_type: p.seat_tier_type,
			tiers: ((p.seatTiers && p.seatTiers.tier) || []).map((t) => ({
				min_seats: t.min_seats,
				max_seats: t.max_seats || undefined,
				price_per_seat: t.price_per_seat,
			})),
		},
	}));
	const metered = (v.meteredPrice || []).map((p) => ({
		amount_type: 'metered_unit',
		price_currency: p.currency,
		tax_behavior: p.tax_behavior || undefined,
		meter_id: p.meter_id,
		unit_amount: p.unit_amount,
		cap_amount: p.cap_amount || undefined,
	}));
	return [...fixed, ...custom, ...seatBased, ...metered];
}

const taxBehaviorOptions = [
	{ name: 'Based on Customer Location', value: 'location' },
	{ name: 'Inclusive', value: 'inclusive' },
	{ name: 'Exclusive', value: 'exclusive' },
];

const priceGroupOptions: INodeProperties['options'] = [
	{
		displayName: 'Fixed Price',
		name: 'fixedPrice',
		values: [
			{ displayName: 'Currency', name: 'currency', type: 'options', options: currencyOptions, default: 'usd' },
			{ displayName: 'Tax Behavior', name: 'tax_behavior', type: 'options', options: taxBehaviorOptions, default: 'exclusive' },
			{ displayName: 'Amount (Cents)', name: 'price_amount', type: 'number', default: 0, description: 'Set to 0 for a free price' },
		],
	},
	{
		displayName: 'Custom Price (Pay What You Want)',
		name: 'customPrice',
		values: [
			{ displayName: 'Currency', name: 'currency', type: 'options', options: currencyOptions, default: 'usd' },
			{ displayName: 'Maximum Amount (Cents)', name: 'maximum_amount', type: 'number', default: 0 },
			{ displayName: 'Minimum Amount (Cents)', name: 'minimum_amount', type: 'number', default: 0, description: 'Set to 0 to also accept $0' },
			{ displayName: 'Preset Amount (Cents)', name: 'preset_amount', type: 'number', default: 0 },
			{ displayName: 'Tax Behavior', name: 'tax_behavior', type: 'options', options: taxBehaviorOptions, default: 'exclusive' },
		],
	},
	{
		displayName: 'Seat-Based Price',
		name: 'seatBasedPrice',
		values: [
			{ displayName: 'Currency', name: 'currency', type: 'options', options: currencyOptions, default: 'usd' },
			{ displayName: 'Tax Behavior', name: 'tax_behavior', type: 'options', options: taxBehaviorOptions, default: 'exclusive' },
			{
				displayName: 'Seat Tier Type',
				name: 'seat_tier_type',
				type: 'options',
				options: [
					{ name: 'Volume (Flat Rate per Tier)', value: 'volume' },
					{ name: 'Graduated (per-Tier Range)', value: 'graduated' },
				],
				default: 'volume',
			},
			{
				displayName: 'Seat Tiers',
				name: 'seatTiers',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Tier' },
				default: {},
				options: [
					{
						displayName: 'Tier',
						name: 'tier',
						values: [
							{ displayName: 'Min Seats', name: 'min_seats', type: 'number', default: 1, typeOptions: { minValue: 1 } },
							{ displayName: 'Max Seats', name: 'max_seats', type: 'number', default: 0, description: 'Leave 0 for unlimited' },
							{ displayName: 'Price Per Seat (Cents)', name: 'price_per_seat', type: 'number', default: 0 },
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Metered Price',
		name: 'meteredPrice',
		values: [
			{ displayName: 'Cap Amount (Cents)', name: 'cap_amount', type: 'number', default: 0, description: 'Maximum total charge per period; 0 for no cap' },
			{ displayName: 'Currency', name: 'currency', type: 'options', options: currencyOptions, default: 'usd' },
			{ displayName: 'Meter ID', name: 'meter_id', type: 'string', default: '' },
			{ displayName: 'Tax Behavior', name: 'tax_behavior', type: 'options', options: taxBehaviorOptions, default: 'exclusive' },
			{
				displayName: 'Unit Amount (Cents)',
				name: 'unit_amount',
				type: 'string',
				default: '0',
				description: 'Price per unit in cents, as a string to preserve up to 12 decimal places',
			},
		],
	},
];

export const productCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		typeOptions: { minLength: 3, maxLength: 64 },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Billing Type',
		name: 'billingType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'One-Time', value: 'oneTime' },
			{ name: 'Recurring', value: 'recurring' },
		],
		default: 'oneTime',
	},
	{
		displayName: 'Recurring Interval',
		name: 'recurring_interval',
		type: 'options',
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Week', value: 'week' },
			{ name: 'Month', value: 'month' },
			{ name: 'Year', value: 'year' },
		],
		default: 'month',
		required: true,
		displayOptions: { show: showRecurring },
		routing: { send: { type: 'body', property: 'recurring_interval' } },
	},
	{
		displayName: 'Recurring Interval Count',
		name: 'recurring_interval_count',
		type: 'number',
		default: 1,
		displayOptions: { show: showRecurring },
		description: 'If set to 2, the customer is charged every other interval instead of every interval',
		routing: { send: { type: 'body', property: 'recurring_interval_count' } },
	},
	{
		displayName: 'Prices',
		name: 'prices',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Price' },
		default: {},
		required: true,
		displayOptions: { show },
		description: 'At least one price is required; add one or more of the price types below',
		options: priceGroupOptions,
		routing: { send: { type: 'body', property: 'prices', value: `={{ (${buildPricesArray.toString()})($value) }}` } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'description', value: '={{$value || undefined}}' } },
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
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showRecurring },
		options: [
			{
				displayName: 'Trial Interval',
				name: 'trial_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { trial_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval Count',
				name: 'trial_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { trial_interval_count: '={{$value}}' } } },
			},
			{
				displayName: 'Usage-Based Billing Interval',
				name: 'meter_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				description: 'Billing cycle for metered-unit prices on this product, if different from the base recurring interval',
				routing: { request: { body: { meter_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Usage-Based Billing Interval Count',
				name: 'meter_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { meter_interval_count: '={{$value}}' } } },
			},
		],
	},
];
