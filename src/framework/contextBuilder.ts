import { GraphQLContext } from '../types';
import { LocalGQLExtension } from './collectLocalExtensions';

type ContextBuilderInput = {
    extensions: LocalGQLExtension[];
};

/**
 * @summary Builds a new instance of the GraphQLContext,
 *          with additions from local extensions
 */
export function contextBuilder({ extensions }: ContextBuilderInput) {
    return (headers: Record<string, unknown>): GraphQLContext => {
        const legacyToken = headers.authorization as string | undefined;
        const currency = headers['Content-Currency'] as string | undefined;
        const store = headers.Store as string | undefined;

        // TODO: In dev mode, use Object.seal to prevent
        // mutations to baseContext
        const baseContext = { legacyToken, currency, store };
        // We don't want an extension setup func to rely
        // on context values from other extension setup funcs,
        // because it would create an implicit dependency on extension
        // execution order, which is currently random.
        const finalContext = { ...baseContext };
        for (const extension of extensions) {
            if (!extension.context) continue;

            const contextResult = {
                // TODO: now that we switched to package.json names for
                // extensions, the keys in this object are gonna suck
                [extension.name]: extension.context(baseContext),
            };
            // additions to context are merged in with a namespace
            // to prevent collisions between extensions
            Object.assign(finalContext, contextResult);
        }

        return finalContext;
    };
}
