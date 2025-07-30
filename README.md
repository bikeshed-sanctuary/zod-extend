# zod-extend

This package allows you to create an `extendZod` function, so you can import
your [Zod](https://github.com/colinhacks/zod) schemas in other packages.

```bash
npm install zod-extend
```

### Package that exports `extendZod`

```typescript
import createExtendZod from 'zod-extend';

// Create your extendZod function
export const extendZod = createExtendZod({
  currency: options => z.enum(['USD', 'CAD', 'EUR', /* ... */]),
});
```

### Package that imports `extendZod`

```typescript
import { z } from 'zod';
import { extendZod } from 'zod-currency';

const extendedZ = extendZod(z);

// Now you can use the extended schemas
const schema = extendedZ.currency();
```

## API Reference

### `createExtendZod(extensions)`

Creates a standardized `extendZod` function.

**Parameters:**
- `extensions` (object): An object containing schema creator functions to add to the extended zod instance

**Returns:**
- A function that takes a zod instance and returns an extended version with your custom schemas

**Type:**
```typescript
function createExtendZod<T extends ExtendZodOptions>(extensions: T): (z: typeof import('zod').z) => typeof z & T
```

## License

MIT
