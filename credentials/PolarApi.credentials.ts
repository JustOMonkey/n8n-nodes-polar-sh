import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PolarApi implements ICredentialType {
	name = 'polarApi';

	displayName = 'Polar API';

	icon: Icon = { light: 'file:../icons/polar.svg', dark: 'file:../icons/polar.dark.svg' };

	documentationUrl = 'https://polar.sh/docs/api-reference/introduction';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Production', value: 'production' },
				{ name: 'Sandbox', value: 'sandbox' },
			],
			default: 'production',
			description: 'Whether to call the live Polar API or the Sandbox environment',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'A Polar Organization Access Token (polar_oat_...), created from the Polar dashboard',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.environment === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh"}}',
			url: '/v1/organizations/',
			method: 'GET',
		},
	};
}
