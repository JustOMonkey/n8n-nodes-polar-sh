import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { benefitGrantGetAllDescription } from './getAll';

const showOnlyForBenefitGrant = { resource: ['benefitGrant'] };

export const benefitGrantDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForBenefitGrant },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many benefit grants',
				description: 'Get many benefit grants across many benefits and customers',
				routing: {
					request: { method: 'GET', url: '=/benefit-grants/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('benefitGrant'),
	...benefitGrantGetAllDescription,
];
