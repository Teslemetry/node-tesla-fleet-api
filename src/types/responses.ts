export type OptionsResponse = { code: string; displayName: string; isActive: boolean }[];

/** The `{ response }` envelope the Fleet API wraps most payloads in. */
export type ResponseEnvelope<T> = { response: T };
