
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isObject(x: unknown): x is Record<string, unknown> {
  return (typeof x === 'object' && !Array.isArray(x) && x !== null);
}
export function isBoolean(x: unknown): x is boolean {
  return x === false || x === true;
}

/**
 * Validates input to ensure it's an object with all requiredKeys
 * and, optionally, optionalKeys. If it's not an object or it doesn't
 * have all required keys we return `null`. If there are extra keys we
 * prune them from the returned object. All values are strings.
 */
export function validatedStringObject<
  const R extends string, // required keys
  const O extends string = never // optional keys
>(
  x: unknown,
  requiredKeys: readonly R[],
  optionalKeys: readonly O[] = []
): { [K in R]: string } & { [K in O]?: string } | null {
  if (!isObject(x)) return null;
  const result: Record<string, string> = {};
  for (const key of requiredKeys) {
    if (!isString(x[key])) return null;
    result[key] = x[key];
  }
  for (const key of optionalKeys) {
    if (Object.hasOwn(x, key) && isString(x[key])) {
      result[key] = x[key];
    }
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return result as { [K in R]: string } & { [K in O]?: string };
}

export function isOneOf<
  const T extends readonly string[]
>(x: unknown, options: T): x is T[number] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return options.includes(x as T[number]);
}
