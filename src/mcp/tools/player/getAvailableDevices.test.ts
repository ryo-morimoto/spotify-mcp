import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetAvailableDevicesTool } from "./getAvailableDevices.ts";

describe("get-available-devices tool", () => {
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

    const mockClient = {
      player: {
        getAvailableDevices: vi.fn().mockResolvedValue(mockDevices),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAvailableDevicesTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const response = JSON.parse((result.content[0] as any).text);
    expect(response.devices).toHaveLength(2);
    expect(response.devices[0].name).toBe("My Computer");
    expect(response.devices[0].type).toBe("Computer");
    expect(response.devices[0].is_active).toBe(true);
    expect(response.devices[1].name).toBe("My Phone");
    expect(response.devices[1].type).toBe("Smartphone");
    expect(response.devices[1].is_active).toBe(false);
  });

  it("should return empty list when no devices available", async () => {
    const mockDevices = {
      devices: [],
    };

    const mockClient = {
      player: {
        getAvailableDevices: vi.fn().mockResolvedValue(mockDevices),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAvailableDevicesTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const response = JSON.parse((result.content[0] as any).text);
    expect(response.devices).toHaveLength(0);
  });

  it("should handle API errors", async () => {
    const mockClient = {
      player: {
        getAvailableDevices: vi.fn().mockRejectedValue(new Error("API request failed")),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAvailableDevicesTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get available devices: API request failed",
    );
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

    const mockClient = {
      player: {
        getAvailableDevices: vi.fn().mockResolvedValue(mockDevices),
      },
    } as unknown as SpotifyApi;

    const tool = createGetAvailableDevicesTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const response = JSON.parse((result.content[0] as any).text);
    expect(response.devices[0]).toEqual({
      id: "device3",
      name: "Smart TV",
      type: "TV",
      is_active: false,
      is_private_session: true,
      is_restricted: true,
      volume_percent: 30,
    });
  });
});
