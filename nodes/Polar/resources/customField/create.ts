import type { INodeProperties } from 'n8n-workflow';
import { typedMetadataField } from '../../shared/descriptions';

const show = { resource: ['customField'], operation: ['create'] };
const showCheckbox = { ...show, type: ['checkbox'] };
const showNumberDate = { ...show, type: ['number', 'date'] };
const showText = { ...show, type: ['text'] };
const showSelect = { ...show, type: ['select'] };

export const customFieldCreateDescription: INodeProperties[] = [
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description:
			"Identifier of the custom field, used as the key when storing values. Must be unique across the organization. Only ASCII letters, numbers, hyphens, and underscores allowed (e.g. 'preferred-locale').",
		routing: { send: { type: 'body', property: 'slug' } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Name of the custom field',
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Checkbox', value: 'checkbox' },
			{ name: 'Date', value: 'date' },
			{ name: 'Number', value: 'number' },
			{ name: 'Select', value: 'select' },
			{ name: 'Text', value: 'text' },
		],
		default: 'text',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Checkbox Properties',
		name: 'propertiesCheckbox',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showCheckbox },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
		],
		routing: { send: { type: 'body', property: 'properties' } },
	},
	{
		displayName: 'Number/Date Properties',
		name: 'propertiesNumberDate',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showNumberDate },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
			{
				displayName: 'Maximum Value (Le)',
				name: 'le',
				type: 'number',
				default: 0,
				description: 'Inclusive maximum value allowed',
			},
			{
				displayName: 'Minimum Value (Ge)',
				name: 'ge',
				type: 'number',
				default: 0,
				description: 'Inclusive minimum value allowed',
			},
		],
		routing: { send: { type: 'body', property: 'properties' } },
	},
	{
		displayName: 'Text Properties',
		name: 'propertiesText',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showText },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
			{ displayName: 'Max Length', name: 'max_length', type: 'number', default: 0, typeOptions: { minValue: 0 } },
			{ displayName: 'Min Length', name: 'min_length', type: 'number', default: 0, typeOptions: { minValue: 0 } },
			{
				displayName: 'Textarea',
				name: 'textarea',
				type: 'boolean',
				default: false,
				description: 'Whether to render the field as a multi-line textarea instead of a single-line input',
			},
		],
		routing: { send: { type: 'body', property: 'properties' } },
	},
	{
		displayName: 'Select Properties',
		name: 'propertiesSelectDetails',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showSelect },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
		],
	},
	{
		displayName: 'Options',
		name: 'customFieldSelectOptions',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Option' },
		default: {},
		displayOptions: { show: showSelect },
		description: 'The selectable options for this field. At least one is required.',
		options: [
			{
				displayName: 'Option',
				name: 'option',
				values: [
					{ displayName: 'Label', name: 'label', type: 'string', default: '', required: true },
					{ displayName: 'Value', name: 'value', type: 'string', default: '', required: true },
				],
			},
		],
	},
	{
		displayName: 'Select Properties (Composed)',
		name: 'propertiesSelect',
		type: 'hidden',
		default: {},
		displayOptions: { show: showSelect },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ (function(details, options){ var result = Object.assign({}, details); if (options && options.length) { result.options = options; } return result; })($parameter["propertiesSelectDetails"], ($parameter["customFieldSelectOptions"].option || []).map((o) => ({ value: o.value, label: o.label }))) }}',
			},
		},
	},
	typedMetadataField('metadata', 'metadata', 'Metadata', show),
];
