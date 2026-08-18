import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export async function polarApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
	body: IDataObject | undefined = undefined,
) {
	const credentials = await this.getCredentials('polarApi');
	const baseURL =
		credentials.environment === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

	const options: IHttpRequestOptions = {
		method,
		qs,
		body,
		url: `${baseURL}/v1${endpoint}`,
		json: true,
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'polarApi', options);
}
