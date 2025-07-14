import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyAudiobookResult, ToolDefinition } from "@types";
import { z } from "zod";

const searchAudiobooksSchema = {
  query: z.string().describe("Search query for audiobooks"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe("Maximum number of results (1-50)"),
} as const;

type SearchAudiobooksInput = z.infer<z.ZodObject<typeof searchAudiobooksSchema>>;

export const createSearchAudiobooksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof searchAudiobooksSchema> => {
  const mapAudiobookToResult = (audiobook: any): SpotifyAudiobookResult => ({
    id: audiobook.id,
    name: audiobook.name,
    description: audiobook.description,
    authors: audiobook.authors.map((author: any) => author.name),
    narrators: audiobook.narrators.map((narrator: any) => narrator.name),
    publisher: audiobook.publisher,
    total_chapters: audiobook.total_chapters,
    explicit: audiobook.explicit,
    external_url: audiobook.external_urls.spotify,
    images: audiobook.images.map((img: any) => ({
      url: img.url,
      height: img.height,
      width: img.width,
    })),
  });

  return {
    name: "search_audiobooks",
    title: "Search Audiobooks",
    description: "Search for audiobooks on Spotify",
    inputSchema: searchAudiobooksSchema,
    handler: async (input: SearchAudiobooksInput): Promise<CallToolResult> => {
      try {
        const limit = input.limit ?? 20;
        const results = await spotifyClient.search(input.query, ["audiobook"], "JP", limit as any);

        const audiobooks: SpotifyAudiobookResult[] =
          results.audiobooks.items.map(mapAudiobookToResult);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(audiobooks, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching audiobooks: ${error}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
};
