import { OBJECT_EXTEND_FUNCTION_ENTRIES } from 'universal-symbols';

/**
 * Options for creating an extendZod function
 */
export interface ExtendZodOptions {
  [key: string]: (...args: any[]) => any;
}

/**
 * Type for the extendZod function returned by createExtendZod
 */
export type ExtendZodFunction<T extends ExtendZodOptions> = (z: typeof import('zod').z) => typeof z & T;

/**
 * Creates a standardized extendZod function that can be used by zod extension packages
 * 
 * @param extensions - An object containing schema creator functions to add to the extended zod instance
 * @returns An extendZod function that extends the provided zod instance with the specified schemas
 * 
 * @example
 * ```typescript
 * import createExtendZod from 'zod-extend';
 * 
 * export const extendZod = createExtendZod({
 *   currency: (options: CurrencySchemaOptions = {}) => createCurrencySchema(options)
 * });
 * ```
 */
export function createExtendZod<T extends ExtendZodOptions>(extensions: T): ExtendZodFunction<T> {
  const extendZod = function extendZod(z: typeof import('zod').z) {
    const extendedZ = Object.create(Object.getPrototypeOf(z));
    Object.assign(extendedZ, z);
    for (const [key, value] of Object.entries(extensions)) {
      (extendedZ as any)[key] = value;
    }
    Object.freeze(extendedZ);
    return extendedZ as typeof z & T;
  };
  (extendZod as any)[OBJECT_EXTEND_FUNCTION_ENTRIES] = extensions;
  return extendZod;
}

export default createExtendZod;
