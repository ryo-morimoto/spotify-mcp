import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetTrackAudioAnalysisTool } from "@mcp/tools/tracks/getAudioAnalysis.ts";

describe("get-track-audio-analysis tool", () => {
  const mockClient = {
    tracks: {
      audioAnalysis: vi.fn(),
    },
  } as unknown as SpotifyApi;

  it("should get audio analysis successfully", async () => {
    const mockAudioAnalysis = {
      meta: {
        analyzer_version: "4.0.0",
        platform: "Linux",
        detailed_status: "OK",
        status_code: 0,
        timestamp: 1495193577,
        analysis_time: 6.93906,
        input_process: "libvorbisfile L+R 44100->22050",
      },
      track: {
        num_samples: 4585515,
        duration: 207.95985,
        sample_md5: "string",
        offset_seconds: 0,
        window_seconds: 0,
        analysis_sample_rate: 22050,
        analysis_channels: 1,
        end_of_fade_in: 0,
        start_of_fade_out: 201.13705,
        loudness: -5.883,
        tempo: 118.211,
        tempo_confidence: 0.73,
        time_signature: 4,
        time_signature_confidence: 0.994,
        key: 9,
        key_confidence: 0.408,
        mode: 0,
        mode_confidence: 0.485,
        codestring: "string",
        code_version: 3.15,
        echoprintstring: "string",
        echoprint_version: 4.15,
        synchstring: "string",
        synch_version: 1,
        rhythmstring: "string",
        rhythm_version: 1,
      },
      bars: [
        {
          start: 0.49567,
          duration: 2.18749,
          confidence: 0.925,
        },
      ],
      beats: [
        {
          start: 0.49567,
          duration: 0.21701,
          confidence: 0.883,
        },
      ],
      sections: [
        {
          start: 0,
          duration: 6.97092,
          confidence: 1,
          loudness: -14.938,
          tempo: 113.178,
          tempo_confidence: 0.647,
          key: 9,
          key_confidence: 0.297,
          mode: 1,
          mode_confidence: 0.471,
          time_signature: 4,
          time_signature_confidence: 1,
        },
      ],
      segments: [
        {
          start: 0.70154,
          duration: 0.19891,
          confidence: 0.435,
          loudness_start: -23.053,
          loudness_max_time: 0.07305,
          loudness_max: -14.25,
          loudness_end: 0,
          pitches: [
            0.212, 0.141, 0.294, 0.273, 0.184, 0.149, 0.122, 0.966, 0.454, 0.469, 0.117, 0.409,
          ],
          timbre: [
            42.115, 64.373, -0.233, -94.237, 33.968, 130.738, 5.52, -39.806, -10.452, -13.583,
            23.674, 9.002,
          ],
        },
      ],
      tatums: [
        {
          start: 0.49567,
          duration: 0.10853,
          confidence: 0.883,
        },
      ],
    };
    vi.mocked(mockClient.tracks.audioAnalysis).mockResolvedValue(mockAudioAnalysis as any);

    const tool = createGetTrackAudioAnalysisTool(mockClient);
    const result = await tool.handler({ id: "11dFghVXANMlKmJXsNCbNl" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as any;
    expect(resource.resource.uri).toBe("spotify:track:11dFghVXANMlKmJXsNCbNl:audio-analysis");
    expect(resource.resource.mimeType).toBe("application/json");

    const content = JSON.parse(resource.resource.text);
    expect(content).toEqual(mockAudioAnalysis);
    expect(mockClient.tracks.audioAnalysis).toHaveBeenCalledWith("11dFghVXANMlKmJXsNCbNl");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.tracks.audioAnalysis).mockRejectedValue(new Error("API request failed"));

    const tool = createGetTrackAudioAnalysisTool(mockClient);
    const result = await tool.handler({ id: "11dFghVXANMlKmJXsNCbNl" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get audio analysis: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.tracks.audioAnalysis).mockRejectedValue(new Error("Network error"));

    const tool = createGetTrackAudioAnalysisTool(mockClient);
    const result = await tool.handler({ id: "invalid" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get audio analysis: Network error",
    );
  });
});
