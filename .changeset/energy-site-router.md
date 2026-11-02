---
"tesla-fleet-api": minor
---

`tesla-fleet-api/router` adds `EnergySiteRouter` and the merge helpers `merge_local_into_cloud`, `merge_live_status` and `merge_site_info`, with `LOCAL_LIVE_STATUS_KEYS` and `LOCAL_SITE_INFO_KEYS` (RTR-2). A key overlays only when it is owned and not null, so a zero reading wins and a key local cannot serve keeps its cloud value. The helpers take unwrapped documents, the value under `response`.
