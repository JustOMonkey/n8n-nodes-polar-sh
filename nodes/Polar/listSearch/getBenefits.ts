import type { ILoadOptionsFunctions, INodeListSearchItems, INodeListSearchResult } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type BenefitItem = { id: string; description: string };
type BenefitListResponse = { items: BenefitItem[]; pagination: { total_count: number; max_page: number } };

export async function getBenefits(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? +paginationToken : 1;
	const responseData: BenefitListResponse = await polarApiRequest.call(this, 'GET', '/benefits/', {
		query: filter,
		page,
		limit: 50,
	});

	const results: INodeListSearchItems[] = responseData.items.map((item) => ({
		name: item.description,
		value: item.id,
	}));

	const nextPaginationToken = page < responseData.pagination.max_page ? String(page + 1) : undefined;
	return { results, paginationToken: nextPaginationToken };
}
