# Fizzwick

A mocktail recipe app where each drink has parts you can swap, and the ingredients and steps follow your choices. The app uses bartending vocabulary throughout.

## Drinks

**Drink**:
A base mocktail recipe with a glass, a Method, fixed parts, and one or more Slots.
_Avoid_: Recipe, base, template, mocktail (inside the app)

**House Drink**:
A Drink that ships with Fizzwick and changes only when the app updates.
_Avoid_: Built-in drink, default drink

**Custom Drink**:
A Drink a user made or imported, which they can edit and delete. An import always becomes a new Custom Drink, never replacing an existing one.
_Avoid_: User drink, imported drink

**Slot**:
A place in a Drink where one Option is swapped in, such as fruit, sweetener, fizz, or garnish. A Slot may be optional, in which case leaving it empty drops its ingredients and steps.
_Avoid_: Swap, variable, category, component

**Option**:
One choice that can fill a Slot, bringing its own ingredients, amounts, and step wording, and possibly a different Method.
_Avoid_: Variant, choice, ingredient

**Retired Option**:
An Option that can no longer be picked but still appears in Favorites that already use it. Options are retired, never removed.
_Avoid_: Deleted option, deprecated option

**Riff**:
A Drink together with the Option picked for each of its Slots.
_Avoid_: Mix, combo, build, variation

**House Spec**:
The Riff a House Drink opens with: Fizzwick's standard version of that drink.
_Avoid_: Default riff, original, classic

**Favorite**:
A Riff the user has saved, with an optional name and note.
_Avoid_: Bookmark, saved drink

**Flavor Tag**:
A label describing how a Drink tastes, such as citrus, herbal, creamy, or spicy.
_Avoid_: Category, genre

**Dietary Tag**:
A label on an Option marking caffeine, dairy, nuts, or egg. A Riff shows the Dietary Tags of its current Options.
_Avoid_: Allergen flag, warning

## Making

**Method**:
How a Drink is put together: build, shake, stir, blend, or a variant such as dry shake.
_Avoid_: Technique, style

**Mise en Place**:
Everything a Riff needs, laid out before the first step: the glass, the tools, and the ingredients with amounts.
_Avoid_: Prep list, shopping list, checklist

**Top**:
A measure meaning "fill the rest of the glass", with no fixed amount.
_Avoid_: Fill, splash

**Bar Term**:
A bartending word with a short plain definition that the app can explain wherever it appears.
_Avoid_: Tooltip, jargon, vocab word
