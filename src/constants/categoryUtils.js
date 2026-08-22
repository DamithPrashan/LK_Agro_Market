/**
 * Shared category translation helper.
 * Usage: getCategoryLabel(t, rawCategoryValue)
 * Returns the translated category name, or the raw value as fallback.
 */

const CATEGORY_KEYS = {
    "Vegetable": "farmer.categoryVegetable",
    "Vegetables": "farmer.categoryVegetable",
    "Fruit": "farmer.categoryFruit",
    "Fruits": "farmer.categoryFruit",
    "Grain": "farmer.categoryGrain",
    "Grains": "farmer.categoryGrain",
    "Other": "farmer.categoryOther",
    "Spices": "farmer.categorySpices",
    "Spice": "farmer.categorySpices",
};

export function getCategoryLabel(t, rawValue) {
    if (!rawValue) return "";
    const key = CATEGORY_KEYS[rawValue];
    return key ? t(key, rawValue) : rawValue;
}
