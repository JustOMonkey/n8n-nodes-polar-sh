import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type BenefitItem = { id: string; description: string };
type BenefitListResponse = { items: BenefitItem[] };

export async function getBenefitOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const responseData: BenefitListResponse = await polarApiRequest.call(this, 'GET', '/benefits/', {
		limit: 100,
	});

	return responseData.items.map((item) => ({ name: item.description, value: item.id }));
}
