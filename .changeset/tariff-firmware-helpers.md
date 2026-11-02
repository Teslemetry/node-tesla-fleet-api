---
"tesla-fleet-api": minor
---

Add `unwrapTariffV2` (also on `tesla-fleet-api/tariff`), which extracts `tariff_content_v2` from a `site_info` response, a `time_of_use_settings` body, or a bare tariff, and throws `InvalidResponse` on a null or malformed body. Add `firmwareCompare` and `firmwareAtLeast`, which compare dotted firmware versions numerically, so `"2025.10"` is ahead of `"2025.9"` and `"Unknown"` sorts behind any version.
