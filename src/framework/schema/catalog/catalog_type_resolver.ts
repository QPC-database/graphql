/**
 * Resolve entity type by type_id value (obtained from storefront)
 *
 * @param type
 */
export function resolveType(type: String) {
    if (type === 'simple') {
        return 'NewProductType';
    }

    if (type === 'downloadable') {
        return 'NewDownloadableProductType';
    }
    return 'NewProductType';
}
