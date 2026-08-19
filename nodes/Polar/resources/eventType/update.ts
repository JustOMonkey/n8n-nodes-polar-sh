import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['eventType'], operation: ['update'] };

export const eventTypeUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Event Type ID',
		name: 'eventTypeId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The label for the event type',
		routing: { send: { type: 'body', property: 'label' } },
	},
	{
		displayName: 'Label Property Selector',
		name: 'labelPropertySelector',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: "Property path to extract a dynamic label from event metadata (e.g. 'subject' or 'metadata.subject')",
		routing: { send: { type: 'body', property: 'label_property_selector', value: '={{$value || undefined}}' } },
	},
];
