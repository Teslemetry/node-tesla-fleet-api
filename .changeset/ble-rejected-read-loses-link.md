---
"tesla-fleet-api": patch
---

A rejected Bluetooth read now marks the link lost even if the backend still reports it connected, so a dead link on Homey is found before the next command writes to it. `BleNotSubmittedError` leaves the link up, because no radio I/O happened, and an adapter should reject a characteristic it never resolved that way. This now applies to a not-submitted write too, unless the frame stopped part way.
