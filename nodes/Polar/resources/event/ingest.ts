import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['event'], operation: ['ingest'] };

type IngestEventEntry = {
	name: string;
	customerId?: string;
	externalCustomerId?: string;
	timestamp?: string;
	externalId?: string;
	parentId?: string;
	memberId?: string;
	externalMemberId?: string;
	metadata?: { field?: Array<{ key: string; value: string }> };
};

function buildEventsArray(entries: IngestEventEntry[]) {
	return entries.map((e) => {
		const event: Record<string, unknown> = { name: e.name };
		if (e.customerId) {
			event.customer_id = e.customerId;
			if (e.memberId) event.member_id = e.memberId;
		} else if (e.externalCustomerId) {
			event.external_customer_id = e.externalCustomerId;
			if (e.externalMemberId) event.external_member_id = e.externalMemberId;
		}
		if (e.timestamp) event.timestamp = e.timestamp;
		if (e.externalId) event.external_id = e.externalId;
		if (e.parentId) event.parent_id = e.parentId;
		if (e.metadata && e.metadata.field && e.metadata.field.length) {
			event.metadata = Object.fromEntries(e.metadata.field.map((f) => [f.key, f.value]));
		}
		return event;
	});
}

export const eventIngestDescription: INodeProperties[] = [
	{
		displayName: 'Events',
		name: 'events',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Event' },
		default: {},
		required: true,
		displayOptions: { show },
		description: 'The batch of events to ingest. Provide exactly one of Customer ID / External Customer ID per event.',
		options: [
			{
				displayName: 'Event',
				name: 'event',
				values: [
					{ displayName: 'Customer ID', name: 'customerId', type: 'string', default: '' },
					{ displayName: 'Event Name', name: 'name', type: 'string', default: '', required: true },
					{ displayName: 'External Customer ID', name: 'externalCustomerId', type: 'string', default: '' },
					{
						displayName: 'External ID',
						name: 'externalId',
						type: 'string',
						default: '',
						description: 'Your own unique identifier for this event, useful for deduplication',
					},
					{
						displayName: 'External Member ID',
						name: 'externalMemberId',
						type: 'string',
						default: '',
						description:
							"ID of the member within the customer's organization who performed the action (B2B attribution). Only applies alongside External Customer ID.",
					},
					{
						displayName: 'Member ID',
						name: 'memberId',
						type: 'string',
						default: '',
						description:
							"ID of the member within the customer's organization who performed the action (B2B attribution). Only applies alongside Customer ID.",
					},
					{
						displayName: 'Metadata',
						name: 'metadata',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Metadata Field' },
						default: {},
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
					},
					{
						displayName: 'Parent ID',
						name: 'parentId',
						type: 'string',
						default: '',
						description: 'A Polar event ID or your own External ID of the parent event, for correlated usage',
					},
					{
						displayName: 'Timestamp',
						name: 'timestamp',
						type: 'dateTime',
						default: '',
						description: 'Defaults to the current time if left empty',
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'events',
				value: `={{ (${buildEventsArray.toString()})($value.event || []) }}`,
			},
		},
	},
];
