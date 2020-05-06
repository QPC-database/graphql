import { mergeSchemas } from 'graphql-tools';
import { join } from 'path';
import { readVar, hasVar } from './env';
import { contextBuilder } from './contextBuilder';
import { collectRemoteExtensions } from './collectRemoteExtensions';
import {
    collectLocalExtensions,
    ExtensionPathResolverResult,
} from './collectLocalExtensions';

export type MagentoGraphQLOpts = {
    /** Allow customizing how local extensions are found */
    localExtensionPathResolver?: (
        extensionRoots: string[],
    ) => Promise<ExtensionPathResolverResult[]>;
};

/**
 * @summary Creates a new executable GraphQL schema and context
 *          function that can be used with any node HTTP library
 */
export async function prepareForServer(opts: MagentoGraphQLOpts = {}) {
    const builtInExtensionsRoot = join(__dirname, '../extensions');
    const localExtensions = await collectLocalExtensions(
        [
            // TODO: node_modules + builtins by default
            builtInExtensionsRoot,
        ],
        opts.localExtensionPathResolver,
    );
    const schemas = [...localExtensions.schemas, ...localExtensions.typeDefs];
    if (hasVar('IO_PACKAGES')) {
        const packages = readVar('IO_PACKAGES').asArray();
        schemas.push(await collectRemoteExtensions(packages));
    }

    const schema = mergeSchemas({
        // @ts-ignore Types are wrong. The lib's implementation
        // already merges this array with `typeDefs`
        // https://github.com/Urigo/graphql-tools/blob/03b70c3f3dc71bdb846aa02bdd645ab4b3a96a87/src/stitch/mergeSchemas.ts#L106-L108
        subschemas: schemas,
        // @ts-ignore The `IResolvers` type that graphql-tools
        // uses has a string:any index signature that would widen
        // types, so we're ignoring it
        resolvers: localExtensions.resolvers,
        mergeDirectives: true,
    });

    const context = contextBuilder({
        extensions: localExtensions.extensions,
    });

    return { schema, context };
}
