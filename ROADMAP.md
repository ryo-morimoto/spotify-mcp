# Spotify Remote MCP Server Roadmap

Thank you for trying out the beta of our MCP server! This document outlines our path to `v1.0`. Items are not necessarily in priority order.

## Path to 1.0

- [ ] **Ability to see Spotify API rate limit status** - This will enable Claude to understand when rate limits are approaching and adjust request patterns accordingly
- [ ] **Cross-account support** - Enable Claude to switch between multiple Spotify accounts in a single session
- [ ] **Ability to modify Spotify Connect devices** - Let Claude rename devices, set default devices, and manage device groups
- [ ] **Support for podcast and audiobook playback** - Extend beyond music to support all Spotify content types
- [ ] **Ability to create collaborative playlists** - Allow Claude to create and manage playlists that multiple users can edit
- [ ] **Better error handling for region-locked content** - Provide clear feedback when content is unavailable in user's region
- [ ] **Support for Spotify Web API batch operations** - Enable efficient bulk operations for playlist management
- [ ] **Customizable tool prompts** - Full control over Claude's Spotify interactions with template variables like `$CURRENT_TRACK`, `$USER_PLAYLISTS`, etc. Users can customize behavior while accessing Spotify context

---

**Note:** This roadmap represents our current vision for reaching `v1.0` and is subject to change based on user feedback and development priorities.

We welcome feedback on these planned features! If you're interested in contributing to any of these features, please open an issue to discuss implementation details with us. We're also open to suggestions for new features not listed here.
