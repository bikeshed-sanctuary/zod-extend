import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import createExtendZod, { ExtendZodOptions } from './index';

describe('createExtendZod', () => {
  it('should create an extendZod function', () => {
    const extendZod = createExtendZod({});
    expect(typeof extendZod).toBe('function');
  });

  it('should extend zod with custom schemas', () => {
    const mockSchema = z.string();
    const extendZod = createExtendZod({
      custom: () => mockSchema
    });

    const extendedZ = extendZod(z);
    expect(extendedZ.custom).toBeDefined();
    expect(typeof extendedZ.custom).toBe('function');
  });

  it('should preserve all original zod methods', () => {
    const extendZod = createExtendZod({
      custom: () => z.string()
    });

    const extendedZ = extendZod(z);
    
    // Check that original zod methods are still available
    expect(extendedZ.string).toBeDefined();
    expect(extendedZ.number).toBeDefined();
    expect(extendedZ.boolean).toBeDefined();
    expect(extendedZ.object).toBeDefined();
    expect(extendedZ.array).toBeDefined();
    expect(extendedZ.union).toBeDefined();
    expect(extendedZ.intersection).toBeDefined();
  });

  it('should work with multiple custom schemas', () => {
    const extendZod = createExtendZod({
      currency: (options: { precision?: number } = {}) => z.string().refine(() => true),
      email: () => z.string().email(),
      phone: () => z.string().regex(/^\d{10}$/)
    });

    const extendedZ = extendZod(z);
    
    expect(extendedZ.currency).toBeDefined();
    expect(extendedZ.email).toBeDefined();
    expect(extendedZ.phone).toBeDefined();
  });

  it('should allow custom schemas to accept parameters', () => {
    const extendZod = createExtendZod({
      currency: (precision: number = 2) => z.string().refine(() => true)
    });

    const extendedZ = extendZod(z);
    const schema = extendedZ.currency(3);
    expect(schema).toBeDefined();
  });

  it('should maintain proper inheritance chain', () => {
    const extendZod = createExtendZod({
      custom: () => z.string()
    });

    const extendedZ = extendZod(z);
    
    // Check that the prototype chain is maintained
    expect(Object.getPrototypeOf(extendedZ)).toBe(Object.getPrototypeOf(z));
  });

  it('should work with complex schema creators', () => {
    interface CurrencyOptions {
      allowNegative?: boolean;
      precision?: number;
    }

    const createCurrencySchema = (options: CurrencyOptions = {}) => {
      const { allowNegative = false, precision = 2 } = options;
      return z.string().refine((val) => {
        const regex = allowNegative 
          ? new RegExp(`^-?\\d+(\\.\\d{1,${precision}})?$`)
          : new RegExp(`^\\d+(\\.\\d{1,${precision}})?$`);
        return regex.test(val);
      });
    };

    const extendZod = createExtendZod({
      currency: createCurrencySchema
    });

    const extendedZ = extendZod(z);
    
    // Test positive currency
    const positiveSchema = extendedZ.currency({ allowNegative: false, precision: 2 });
    const positiveResult = positiveSchema.safeParse('123.45');
    expect(positiveResult.success).toBe(true);

    // Test negative currency (should fail when not allowed)
    const negativeResult = positiveSchema.safeParse('-123.45');
    expect(negativeResult.success).toBe(false);

    // Test negative currency with allowNegative
    const negativeAllowedSchema = extendedZ.currency({ allowNegative: true, precision: 2 });
    const negativeAllowedResult = negativeAllowedSchema.safeParse('-123.45');
    expect(negativeAllowedResult.success).toBe(true);
  });

  it('should handle empty extensions object', () => {
    const extendZod = createExtendZod({});
    const extendedZ = extendZod(z);
    
    // Should still have all original zod methods
    expect(extendedZ.string).toBeDefined();
    expect(extendedZ.number).toBeDefined();
  });

  it('should not mutate the original zod instance', async () => {
    // Create a fresh zod instance for this test
    const { z: freshZ } = await import('zod');
    
    const extendZod = createExtendZod({
      custom: () => freshZ.string()
    });

    // Store original zod methods
    const originalMethods = Object.getOwnPropertyNames(freshZ);
    const originalHasCustom = 'custom' in freshZ;
    
    const extendedZ = extendZod(freshZ);
    
    // Extended zod should have the custom method
    expect('custom' in extendedZ).toBe(true);
    
    // Original zod should not have the custom method
    expect('custom' in freshZ).toBe(originalHasCustom);
    
    // Original zod should have the same methods as before
    const currentMethods = Object.getOwnPropertyNames(freshZ);
    expect(currentMethods).toEqual(originalMethods);
  });

  it('should work with async schema creators', async () => {
    const extendZod = createExtendZod({
      asyncSchema: async () => z.string()
    });

    const extendedZ = extendZod(z);
    const schema = await extendedZ.asyncSchema();
    expect(schema).toBeDefined();
  });

  it('should handle schema creators that return different types', () => {
    const extendZod = createExtendZod({
      stringSchema: () => z.string(),
      numberSchema: () => z.number(),
      booleanSchema: () => z.boolean(),
      objectSchema: () => z.object({})
    });

    const extendedZ = extendZod(z);
    
    expect(extendedZ.stringSchema).toBeDefined();
    expect(extendedZ.numberSchema).toBeDefined();
    expect(extendedZ.booleanSchema).toBeDefined();
    expect(extendedZ.objectSchema).toBeDefined();
  });

  it('should maintain proper typing for ExtendZodOptions', () => {
    const options: ExtendZodOptions = {
      test: () => z.string()
    };
    
    const extendZod = createExtendZod(options);
    expect(typeof extendZod).toBe('function');
  });

  it('should return a frozen object', () => {
    const extendZod = createExtendZod({
      custom: () => z.string()
    });

    const extendedZ = extendZod(z);
    expect(Object.isFrozen(extendedZ)).toBe(true);
  });

  it('should prevent mutations to the extended zod', () => {
    const extendZod = createExtendZod({
      custom: () => z.string()
    });

    const extendedZ = extendZod(z);
    
    // Should not be able to add new properties
    expect(() => {
      (extendedZ as any).newProperty = 'test';
    }).toThrow();
    
    // Should not be able to modify existing properties
    expect(() => {
      (extendedZ as any).custom = () => z.number();
    }).toThrow();
  });
}); 