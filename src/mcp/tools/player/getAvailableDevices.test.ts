import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getAvailableDevices } from "./getAvailableDevices.ts";

describe("getAvailableDevices", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        getAvailableDevices: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should return list of available devices", async () => {
    const mockDevices = {
      devices: [
        {
          id: "device1",
          name: "My Computer",
          type: "Computer",
          is_active: true,
          is_private_session: false,
          is_restricted: false,
          volume_percent: 50,
        },
        {
          id: "device2",
          name: "My Phone",
          type: "Smartphone",
          is_active: false,
          is_private_session: false,
          is_restricted: false,
          volume_percent: 80,
        },
      ],
    };

    vi.mocked(mockClient.player.getAvailableDevices).mockResolvedValue(mockDevices);

    const result = await getAvailableDevices(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.devices).toHaveLength(2);
      expect(result.value.devices[0].name).toBe("My Computer");
      expect(result.value.devices[0].type).toBe("Computer");
      expect(result.value.devices[0].is_active).toBe(true);
      expect(result.value.devices[1].name).toBe("My Phone");
      expect(result.value.devices[1].type).toBe("Smartphone");
      expect(result.value.devices[1].is_active).toBe(false);
    }
  });

  it("should return empty list when no devices available", async () => {
    const mockDevices = {
      devices: [],
    };

    vi.mocked(mockClient.player.getAvailableDevices).mockResolvedValue(mockDevices);

    const result = await getAvailableDevices(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.devices).toHaveLength(0);
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.getAvailableDevices).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await getAvailableDevices(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get available devices: API request failed");
    }
  });

  it("should include all device properties", async () => {
    const mockDevices = {
      devices: [
        {
          id: "device3",
          name: "Smart TV",
          type: "TV",
          is_active: false,
          is_private_session: true,
          is_restricted: true,
          volume_percent: 30,
        },
      ],
    };

    vi.mocked(mockClient.player.getAvailableDevices).mockResolvedValue(mockDevices);

    const result = await getAvailableDevices(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const device = result.value.devices[0];
      expect(device).toEqual({
        id: "device3",
        name: "Smart TV",
        type: "TV",
        is_active: false,
        is_private_session: true,
        is_restricted: true,
        volume_percent: 30,
      });
    }
  });
});
