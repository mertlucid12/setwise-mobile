/**
 * gluestack-style ships FontResolver only from a subpath, and that subpath
 * has no adjacent .d.ts. Importing the package's own `src` build instead
 * would drag its (type-error-carrying) TypeScript source into our typecheck,
 * so we point at the compiled CJS build and declare the shape we use.
 */
declare module '@gluestack-style/react/lib/commonjs/plugins' {
  export class FontResolver {
    constructor(config?: Record<string, unknown>);
  }
  export class AddCssTokenVariables {
    constructor(config?: Record<string, unknown>);
  }
}
