export type ClientRegistrationRequest = {
  redirect_uris: string[];
  client_name?: string;
  grant_types?: string[];
  response_types?: string[];
  token_endpoint_auth_method?: string;
};

export type ClientRegistrationResponse = {
  client_id: string;
  client_id_issued_at: number;
  grant_types: string[];
  response_types: string[];
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  client_name?: string;
};

export type RegisteredClient = {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  created_at: number;
};
