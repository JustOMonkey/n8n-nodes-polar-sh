export function nextPageInfo(currentUrl: string, maxPage: number): { next?: string } {
	const url = new URL(currentUrl);
	const currentPage = Number(url.searchParams.get('page') || '1');
	if (currentPage >= maxPage) {
		return {};
	}
	url.searchParams.set('page', String(currentPage + 1));
	return { next: url.toString() };
}
