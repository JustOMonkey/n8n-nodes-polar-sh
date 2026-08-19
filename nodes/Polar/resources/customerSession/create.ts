import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSession'], operation: ['create'] };

export const customerSessionCreateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Provide exactly one of Customer ID / External Customer ID to identify who this session is for',
		routing: { send: { type: 'body', property: 'customer_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Provide exactly one of Customer ID / External Customer ID to identify who this session is for',
		routing: { send: { type: 'body', property: 'external_customer_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description:
			'ID of the member to create a session for. When not provided and the organization has member management enabled, the owner member of the customer is used for individual customers.',
		routing: { send: { type: 'body', property: 'member_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'External Member ID',
		name: 'externalMemberId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Alternative to Member ID',
		routing: { send: { type: 'body', property: 'external_member_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Return URL',
		name: 'returnUrl',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'When set, a back button is shown in the customer portal to return to this URL',
		routing: { send: { type: 'body', property: 'return_url', value: '={{ $value || undefined }}' } },
	},
];
