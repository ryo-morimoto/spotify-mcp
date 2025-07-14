import type { CallToolResult, EmbeddedResource } from "@modelcontextprotocol/sdk/types.js";

export function createResourceUri(
  resourceType: string,
  id?: string,
  queryParams?: Record<string, string>,
  relation?: string,
): string {
  let uri = `spotify:${resourceType}`;

  if (id) {
    uri += `:${id}`;
  }

  if (relation) {
    uri += `:${relation}`;
  }

  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
    uri += `?${params}`;
  }

  return uri;
}

export function createResourceResponse(
  uri: string,
  data: unknown,
  mimeType: string = "application/json",
): CallToolResult {
  const embeddedResource: EmbeddedResource = {
    type: "resource",
    resource: {
      uri,
      mimeType,
      text: JSON.stringify(data, null, 2),
    },
  };

  return {
    content: [embeddedResource],
  };
}
