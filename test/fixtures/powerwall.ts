// Test-only material. Nothing here identifies a real gateway, site or person.

export const GATEWAY_DIN = "1232100-00-E--TG123456789ABC";
export const GATEWAY_PASSWORD = "ABCDEFGHIJKLMNO";

/** Throwaway certificate for `test/helpers/fakegateway.ts`, valid until 2126. */
export const FAKE_GATEWAY_TLS_KEY = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnQ+5iMJYA2gM5ord
dAYbLD0PxhYnCEBW393j1Y7Fca6hRANCAAQw/C/vePQYZuVnf/EIMaeLJfM+78ji
Ux1NBGC908OuxXYTyd34nVCMlwtnJ6pMk+ocWhgdSwtDypE6X+kA6+/y
-----END PRIVATE KEY-----
`;

export const FAKE_GATEWAY_TLS_CERT = `-----BEGIN CERTIFICATE-----
MIIBljCCATugAwIBAgIUUqOhj2A7g2610Dj7EBM3elhWvYMwCgYIKoZIzj0EAwIw
HzEdMBsGA1UEAwwUZmFrZS1nYXRld2F5LmludmFsaWQwIBcNMjYxMTAyMDMzNzM5
WhgPMjEyNjEwMDkwMzM3MzlaMB8xHTAbBgNVBAMMFGZha2UtZ2F0ZXdheS5pbnZh
bGlkMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMPwv73j0GGblZ3/xCDGniyXz
Pu/I4lMdTQRgvdPDrsV2E8nd+J1QjJcLZyeqTJPqHFoYHUsLQ8qROl/pAOvv8qNT
MFEwHQYDVR0OBBYEFHJ4HK2AIfdzD1us9fB1Foz4i4/EMB8GA1UdIwQYMBaAFHJ4
HK2AIfdzD1us9fB1Foz4i4/EMA8GA1UdEwEB/wQFMAMBAf8wCgYIKoZIzj0EAwID
SQAwRgIhAPBoMho7U+5w24O+/4ND6XglhL3EDiJv6yQ3SqCcR2YwAiEA3TltjePa
uhS6nRHRskUkPN8NEbEBBV/YBH8FYjAPeO0=
-----END CERTIFICATE-----
`;

/** Copied from Python's `tests/powerwall/test_transport_signing.py`. A 1024-bit test key, registered on no gateway. */
export const TEST_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIICdQIBADANBgkqhkiG9w0BAQEFAASCAl8wggJbAgEAAoGBAJmlOoA/z98lbrJt
SCpsXVPsgRDc2KkclGXGDR+4iMP/Fttoy0Hx+t8q01WIDHCoOpoQv1NwOWg1ycEU
DLvIryyXH4eOrqY+ZWaAqiqyZ+HjMeNhW4HpD43SkquIn9+hosXJaJxfrNvI1h9g
PIxUnqdKQM+zYmhl3p2NxKkpbnQ7AgMBAAECgYB/TSM3d6en37/kHh+Y5sg87MvT
SOhK1d8uo/XjvmWy3vv1NtKSBQgzN6x6RYrpHLnRROcBHw6xhT9wtkgGnrRkGPqu
cKK7w9Dr6jr02IlUL2vUVb2OY1exef9CP40BMfMM5QxqSE2IrG+u6YR+I3dMPPEP
PrJqucOf/Y78MJuUoQJBAMfGCBJKy19ByzP2xv5d//w7o0E8vGZlYdOy8LtYMNeX
4cM74LzZgA9MmDruT+v1tLTwPKAt2HgnDuEA9AYTdU8CQQDE45lrTItafMAnC9a4
x9Zu0PgPl2z3ibtd0k0vTvVhYN7k6+ulRy5EaEPfdSkxSRfAayA/pXDPy/3IIe8I
4S9VAkA6ohnOXJtyGtpsJvriv24ZdtuEkzHsj8b1nmhfZBP5wv8lERb19pRKaT2o
1jco1xWxoWz5ylrlcPlB+sikW+OrAkAu0jUsyBInnZ0QbAdO/+7lgXpMMuVt5GoT
QKysQGmoE6JN7DCoqEm/aNAjNrhqCQjF8HPFzvEJ6WfbjP5MLUjVAkAa4eA/MCuB
ip8rpmlk2gKy5kT48ehO4GSwb168TI+Bkw0hRAwV+4r1STkCJR+z7fWEi+uBn7VI
IZvqjXsKph1j
-----END PRIVATE KEY-----
`;

/** `EXPECTED_SIGNED_REQUEST` and its inputs, from the same Python test. */
export const SIGNED_REQUEST_VECTOR = {
    now: 1_790_000_000.25,
    messageUuid: Buffer.from(Array.from({ length: 16 }, (_, index) => index)),
    envelope: Buffer.from("120220011a1e0a1c313233323130302d30302d452d2d5447313233343536373839414243", "hex"),
    expected: Buffer.from(
        "320208075224120220011a1e0a1c313233323130302d30302d452d2d54473132" +
            "333435363738394142436a9d020a8f010a8c013081890281810099a53a803fcf" +
            "df256eb26d482a6c5d53ec8110dcd8a91c9465c60d1fb888c3ff16db68cb41f1" +
            "fadf2ad355880c70a83a9a10bf5370396835c9c1140cbbc8af2c971f878eaea6" +
            "3e656680aa2ab267e1e331e3615b81e90f8dd292ab889fdfa1a2c5c9689c5fac" +
            "dbc8d61f603c8c549ea74a40cfb3626865de9d8dc4a9296e743b02030100013a" +
            "88010d8d3bb16a1280016f5fd6a464eeb8e293b9efe76d1036c4fb09ac801dcd" +
            "d6aebc3fd06ed15629626f307a1f7cd16cd5fbec82adb9b0b82faaaf9327452f" +
            "3d93ebe0b8538b40090900ce9bd0f4f83b3783bd9a33ba97d72ce921cc0fa40c" +
            "3b7eb65dea88cd26ef013085b2cf3315caa23a13429ca71b3fd97ee41411d97a" +
            "2948117e0e07d5e7c55b9a0310000102030405060708090a0b0c0d0e0f",
        "hex",
    ),
};
