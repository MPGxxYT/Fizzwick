# Citrus levels in House Drinks

Researched 2026-11-01. No recipe was changed.

## Verdict

**Several Drinks are too sour for a mocktail, but they are not recipe errors.** They use a standard bar spec (equal parts citrus and 1:1 syrup) that was built for a drink with 2 oz of spirit in it. Taking the spirit out leaves the same acid, and sometimes less liquid to spread it through.

**The amount of citrus is the better measure, and 1:1 is the wrong test.** Blueberry Fizz at 1:1 has about 0.82% acid. The carbonated drinks in Dave Arnold's data have 0.38 to 0.51%, not counting two grapefruit drinks (see Evidence). More sugar improves the balance but leaves the acid unchanged, and in one lab study sugar suppressed sourness only slightly.

**Blueberry Fizz: try 0.5 oz lemon and keep 0.75 oz sweetener at the standard 10 oz highball.**

**What is sourced and what is my judgment:**

- Sourced: 1:1 with 1:1 syrup is a normal bar balance. Arnold's carbonated drinks run at about half the acid of his shaken sours. Lemonade and soft drinks have more sugar for each gram of acid than the House Drinks at 1:1.
- My judgment: Arnold's carbonated range, and the sugar-to-acid of lemonade, are sensible targets for a mocktail. No source I could read gives a numeric acid target for non-alcoholic drinks.
- Mixed: the two *Good Drinks* recipes I could check are as tart as the app or more so, so a professional could defend today's specs. Those two contain salt or brine. Preferring less sour is partly taste, and the suggestions below suit this user's taste.

## In the app

The Softer citrus setting, off by default, applies the table below and these Option amounts: agave 0.25 in Nojito, Citrus Spritz and Cherry Limeade, and ginger syrup 1.5 in Ginger Toddy. The amounts are in `src/house-drinks/softer-citrus.ts`, and the recipe files keep today's specs.

Left out for now: the optional Salty Paloma and Tea Sour changes, and swaps that depend on another Slot, such as less sweetener with a sweet soda. Frozen Lemonade agave stays 0.5, since 1 simple is the new amount it matches.

## Drinks to change

Pours are per standard glass, in 0.25 oz steps. "Now" and "new" show acid % and sugar-to-acid.

| Drink | Now | Suggested | Now | New |
|---|---|---|---|---|
| Lavender Lemon Fizz | 0.75 lemon, 0.5 syrup | 0.5 lemon, 0.75 syrup | 0.68%, 6:1 | 0.45%, 14:1 |
| Blueberry Fizz | 0.75 lemon, 0.75 syrup | 0.5 lemon, 0.75 syrup | 0.82%, 11:1 | 0.55%, 17:1 |
| Nojito | 0.75 lime, 0.75 simple | 0.5 lime, 0.75 simple | 0.68%, 9:1 | 0.45%, 14:1 |
| Porch Tea | 0.75 lemon, 0.75 simple, 1.5 water | 0.5 lemon, 0.75 simple, 1.75 water | 0.75%, 9:1 | 0.50%, 14:1 |
| Garden Smash | 0.75 lemon, 0.75 simple | 0.5 lemon, 0.75 simple, add 2 oz soda water | 1.61%, 9:1 | 0.67%, 14:1 |
| Raspberry Clover | 0.75 lemon, 0.75 syrup | 0.5 lemon, 0.75 syrup | 1.29%, 8:1 | 0.95%, 12:1 |
| Frozen Lemonade | 1 lemon, 0.75 simple | 0.75 lemon, 1 simple | 0.51%, 11:1 | 0.39%, 17:1 |
| Watermelon Cooler | 0.5 lime, no added sugar | 0.25 lime | 0.45%, 6:1 | 0.23%, 13:1 |

Optional, if a taste test agrees: Salty Paloma down to 0.25 lime (1.27% to about 1.0%), and Tea Sour down to 0.5 lemon. Both are tart by style. Lavender syrup is strong, so if 0.75 oz tastes soapy, use 0.5 lavender plus 0.25 simple.

Fine as they are: Cherry Limeade, Citrus Spritz, Ginger Mule, Ginger Toddy, Hibiscus Stir, Nada Colada, Orchard Spritz, Spiced Pear, Virgin Mary. Black Tea Old Fashioned has no citrus and Cucumber Tonic has only a wedge.

## Blueberry Fizz test

The user's tastings below are one person's taste, in what was presumably a 16 oz glass with simple syrup. Numbers are my estimates.

| Version | Lemon, simple, berries | Acid | Sugar g/100 ml | Sugar:acid | Result |
|---|---|---|---|---|---|
| Old | 1.25, 0.75, 15 | 0.85% | 5.5 | 6:1 | So sour it was thrown out |
| Current | 1.25, 1.25, 24 | 0.85% | 9.1 | 11:1 | Much better, blueberry prominent, still a little too lemony |
| Next test | 0.75, 1.25, 24 | 0.51% | 9.1 | 18:1 | Not tasted |
| If that is too flat | 1, 1.25, 24 | 0.68% | 9.1 | 13:1 | Not tasted |

Raising the sugar was the right direction, and it took the drink from undrinkable to nearly there. It also fits the lab result that sugar only partly masks sourness: the acid stayed at 0.85%.

The standard spec of 0.5 lemon and 0.75 sweetener scales to 16 oz as 0.8 and 1.2, which round to the 0.75 and 1.25 in the "next test" row. The 1 oz row is about 0.625 oz at 10 oz, which the 0.25 oz steps cannot show. If 1 oz wins, pick between 0.5 and 0.75 at the standard glass, or allow a finer step.

## What the uncle's 1:1 could mean

We can't ask which syrup the uncle meant, so the suggestions above are built to work under each reading.

| Reading | What it would mean | Effect on the answer |
|---|---|---|
| Citrus to 1:1 syrup, too much citrus | More sweet than citrus. Agrees with the data for long drinks. | Use the suggestions above (2:3 citrus to simple). |
| Citrus to 2:1 syrup, too much citrus | 1:1 with rich syrup already equals about 1:1.5 with simple. That is lemonade balance, so this asks for sweeter than lemonade. | App syrup is 1:1, so that ratio doesn't transfer. Less citrus is still the fix. |
| Citrus to either syrup, too much sweetener | Difford's agrees for rich syrup: 0.75 lemon to 1 oz rich comes out sweet. | If the user's next test tastes too sweet, use 0.5 lemon and 0.5 syrup. The user's test argues against cutting sugar first. |
| Citrus to other liquid, or lemon to granulated sugar | No House Drink is near 1:1 citrus to liquid. Lemonade recipes often use 1:1 lemon to dry sugar, which is about 1:1.5 with simple. | Doesn't apply, except as a benchmark. |

The suggested 0.5 lemon to 0.75 simple is the same sweetness as 0.5 lemon to about 0.5 rich syrup, so it would read as 1:1 to someone working in rich syrup.

## Every Drink with citrus, House Spec

Pours are from the JSON and match the list we were given.

| Drink | Liquid oz | Citrus oz | Sweetener oz | Other sugar g | Citrus:sweet | Citrus share | Acid % (ice range) | Sugar g/100 ml | Sugar:acid |
|---|---|---|---|---|---|---|---|---|---|
| Blueberry Fizz | 5.5 | 0.75 lemon | 0.75 honey syrup | 2 berries | 1:1 | 14% | 0.82 (0.69-1.00) | 9.3 | 11 |
| Cherry Limeade | 6.6 | 0.75 lime | 0.75 cherry syrup | 16 soda | 1:1 | 11% | 0.68 (0.58-0.83) | 13.7 | 20 |
| Citrus Spritz | 5.5 | 2 grapefruit | 0.5 honey syrup | 14 juice, tonic | 4:1 | 36% | 0.73 (0.61-0.89) | 13.8 | 19 |
| Frozen Lemonade | 11.8 | 1 lemon | 0.75 simple | 7 berries | 1.3:1 | 8% | 0.51 | 5.4 | 11 |
| Garden Smash | 2.8 | 0.75 lemon | 0.75 simple | 0 | 1:1 | 27% | 1.61 | 14.8 | 9 |
| Ginger Mule | 8.8 | 0.5 lime | none | 22 ginger beer | none | 6% | 0.34 (0.29-0.42) | 8.6 | 25 |
| Ginger Toddy | 7.25 | 0.5 lemon | 0.75 honey | 0 | 2:3 | 7% | 0.41 | 12.2 | 29 |
| Hibiscus Stir | 4.1 | 0.25 lime | 0.5 honey syrup | 0 | 1:2 | 6% | 0.37 plus hibiscus | 7.2 | 20 |
| Lavender Lemon Fizz | 6.6 | 0.75 lemon | 0.5 syrup | 0 | 1.5:1 | 11% | 0.68 (0.58-0.83) | 4.2 | 6 |
| Nada Colada | 7 | 0.5 lime | none | 38 pineapple, coconut | none | 7% | 0.77 | 18.4 | 24 |
| Nojito | 6.6 | 0.75 lime | 0.75 simple | 0 | 1:1 | 11% | 0.68 (0.58-0.83) | 6.3 | 9 |
| Orchard Spritz | 5.5 | 0.25 lemon | none | 15 apple, ginger ale | none | 5% | 0.45 (0.38-0.56) | 9.1 | 20 |
| Porch Tea | 6 | 0.75 lemon | 0.75 simple | 0 | 1:1 | 13% | 0.75 | 6.9 | 9 |
| Raspberry Clover | 3.5 | 0.75 lemon | 0.75 syrup | 0 | 1:1 | 21% | 1.29 | 10.1 | 8 |
| Salty Paloma | 5.5 | 2 grapefruit, 0.5 lime | none | 15 juice, soda | none | 45% | 1.27 (1.08-1.56) | 9.3 | 7 |
| Spiced Pear | 4.2 | 0.5 lemon | 0.5 cinnamon syrup | 10 pear | 1:1 | 12% | 0.71 | 14.2 | 20 |
| Tea Sour | 6.3 | 0.75 lemon | 0.75 simple | 0 | 1:1 | 12% | 0.71 | 6.6 | 9 |
| Virgin Mary | 5.4 | 0.5 lemon | none | 3 tomato | none | 9% | 0.89 | 1.9 | savory |
| Watermelon Cooler | 6.6 | 0.5 lime | none | 6 watermelon | none | 8% | 0.45 (0.38-0.56) | 2.9 | 6 |

**Assumptions, all mine:**

- Ice: an ice-filled glass holds liquid equal to 55% of its size, with a range of 45 to 65% shown above. Porch Tea's 6 oz of pours in a 10 oz glass fits this.
- Top: a topped Drink's soda fills whatever is left of that liquid after the other pours.
- Dilution: shaken drinks with no ice in the glass gain 40% from melt, stirred 25%, rolled 20%. Arnold's Bee's Knees works out at about +50% with alcohol. Egg white counts as 1 oz. Melt after pouring is ignored, and lowers acid and sugar together over time.
- Frozen Lemonade: 1 cup ice and 1 cup berries count as 150 ml each.
- Acid: lemon and lime 6%, grapefruit 2%, pineapple 0.8%, tomato 0.45%, apple 0.5%. Soda, tea and berry acid are left out, so sweet-soda Drinks read a little low.
- Soda: ginger beer uses ginger ale's sugar and grapefruit soda uses lemon-lime's, since I have no figure for either. Coconut cream is assumed to be sweetened cream of coconut.

## How strong each side is

**Syrup strength in the app.** `src/bar-terms/terms.ts` makes simple and demerara from equal cups of sugar and water, so about 46 to 48 Brix. Arnold's simple appears stronger: his numbers imply about 18.5 g/oz, which makes the app's 0.75 oz simple about 12% weaker than his.

| Per fl oz | Amount |
|---|---|
| Lemon or lime juice | 1.8 g acid at 6% (1.4 g citric acid as measured) |
| Grapefruit juice | about 0.6 g acid |
| App simple syrup | 16 g sugar |
| Rich 2:1 syrup | 25 g sugar |

By volume, 1:1 with simple gives 9 g of sugar for each gram of acid. Bartenders call that balanced, and Arnold's sours are near 10:1. On effect, the sour side is stronger in a long cold mocktail:

| Drink type | Sugar per gram of acid |
|---|---|
| App 1:1 with simple | 9 |
| Arnold's shaken sours | about 10 |
| Lemonade | about 14 |
| Arnold's carbonated lime drinks | 12 to 19 |
| Cola | about 28 |

To match lemonade at 14:1, 1 oz lemon needs about 1.5 oz simple or 1 oz rich syrup.

## Swaps

Sugar and sweetness per oz, compared with app simple syrup. Sweetness uses fructose at 1.2 to 1.8 times sucrose and glucose at about 0.74. Amounts are my calculation from USDA composition and the recipes in `terms.ts`.

| Sweetener | Sugar g/oz | Sweetness vs simple | Equal to 0.75 simple |
|---|---|---|---|
| Simple, demerara, chai, cinnamon, lavender, ginger syrup (1:1) | 16 | 1.0 | 0.75 |
| Honey syrup (1:1) | 17 | 1.0 to 1.3 | 0.75 |
| Blueberry, cherry, raspberry syrup | about 13 to 15 (yield is a guess) | 0.8 to 0.9, and raspberry adds acid | 0.75 to 1 |
| App grenadine | about 19 | 1.15 | 0.75 |
| Bottled grenadine | 19 to 27 (USDA sugar and carbs disagree) | 1.15 to 1.65 | 0.5 |
| Maple | 24 | 1.5 | 0.5 |
| Straight honey | 35 | 2.0 to 2.6 | 0.25 to 0.5 |
| Agave | 28 | 1.9 to 2.8 | 0.25 |

**Amounts already differ, but not by enough:**

- Agave 0.5 versus simple 0.75 in Nojito and Frozen Lemonade. Agave is still 1.3 to 1.9 times as sweet. Use 0.25, or 0.375 if that step is allowed.

**Same amount, should differ:**

- Agave 0.5 versus simple 0.5 in Citrus Spritz and Cherry Limeade: agave is about twice as sweet or more. Use 0.25.
- Ginger Toddy: 0.75 honey versus 0.75 ginger syrup. The syrup has half the sugar (26 g versus 12 g). Use 1.5 ginger syrup.
- Blueberry Fizz: blueberry syrup adds about 10 g sugar, but the sweetener slot stays at 0.75. Use 0 to 0.25 sweetener with the syrup.
- Black Tea Old Fashioned: maple 0.25 versus demerara 0.25 gives 6 g versus 4 g. A small effect, and 0.25 is the smallest step, so leave it.

**Fizz swaps change sugar more than any syrup swap.** A sweet soda adds 2.7 to 3.2 g sugar per oz of top.

- Blueberry Fizz with lemon-lime soda or ginger ale gains 12 to 14 g, about double. Use 0 to 0.25 sweetener.
- Lavender Lemon Fizz with tonic goes from 6:1 to 17:1, which alone fixes its balance.
- Cherry Limeade with soda water drops from 20:1 to 8:1. Add the optional sweetener with that Option.
- Orchard Spritz with soda water drops from 20:1 to about 8:1, as sharp as a Nojito. Add 0.25 to 0.5 simple with that Option.

**Other swaps:**

- Nada Colada with coconut milk loses about 28 g sugar, from 24:1 to about 6:1. Bar Terms has no coconut cream entry, so a user could also buy unsweetened cream by mistake. Add a term and about 0.5 simple for coconut milk.
- Cherry Limeade with muddled cherries has about half the sugar of the syrup (5 g versus 10 g). Tart cherry juice likely lowers sugar and adds acid, but I have no figure for it.
- Porch Tea with sparkling lemonade is much milder than the fresh version. Commercial lemonade tops out near 0.7% acid and is often far lower.

**Citrus swaps:**

- Lemon and lime are equal at 6%, so the Garden Smash swap needs no change.
- Grapefruit at about 2% means 2 oz matches about 0.75 oz lemon. The Citrus Spritz lemon Option at 0.75 oz with 0.25 extra sweetener is about right (0.82%, 18:1).
- Blood orange has about 40% of grapefruit's acid if it behaves like orange juice. With tonic it comes out very sweet at about 45:1. Drop the sweetener to 0.25.

## Evidence

**Book access.** *Liquid Intelligence* and *Good Drinks* could not be read online. The Internet Archive copy of Arnold is borrow-only and its search returned "Item not available". Nothing below comes from a direct reading of either book. *Death & Co* and the *PDT* book were also not read, and I could not confirm their specs. A search result showed a [Kindred Cocktails entry for a Death & Co drink](https://kindredcocktails.com/node/5681) at 0.75 lime and 0.75 simple, but I did not open it.

**Arnold's numbers (secondary).** These come from [Karnesky's transcription of pp. 130-135](https://raw.githubusercontent.com/karnesky/cocktail-balance/master/cocktail_data.tsv), which is [described here](https://karnesky.github.io/cocktail-balance/) and warns of possible transcription errors. Arnold's own [Popular Science excerpt](https://www.popsci.com/cocktail-calculus-chart-inner-workings-recipes/) confirms that each style has its own relationships, and that some drinks are better above or below average, but its text gives no numbers.

| Style (with alcohol) | Acid % | Sugar g/100 ml |
|---|---|---|
| Shaken sours with 0.75 oz lemon or lime | mostly 0.76 to 1.05 (Bee's Knees 0.83) | 4 to 9.6 |
| Egg white | 0.49 to 0.68 | 6.7 to 9 |
| Blended | 0.57 to 0.61 | 7.8 to 8.1 |
| Carbonated, lime | 0.38 to 0.51 | 4.9 to 8.3 |
| Carbonated, grapefruit (Gin and Juice) | 0.91 to 1.15 | 5 to 7.2 |
| Built (Old Fashioned) | 0 | 7.6 |

**Ratios in professional recipes.**

- Bartender Jack Schramm, on [VinePair](https://vinepair.com/cocktail-college/techniques-acid-adjusting/): equal parts 6% juice and 50 Brix syrup balance, which is why 2 : 0.75 : 0.75 is the usual sour starting point.
- [Difford's](https://www.diffordsguide.com/encyclopedia/3593/cocktails/2-to-1-rich-sugar-syrup-versus-1-to-1-simple-syrup): 30 ml simple or 20 ml rich roughly balances 30 ml citrus. His [Whiskey Sour](https://www.diffordsguide.com/cocktails/recipe/2083/whiskey-sour) uses 30 lemon to 20 rich, and he finds the 3:4 "golden ratio" too sweet.
- Collins specs: [Difford's Tom Collins](https://www.diffordsguide.com/cocktails/recipe/1972/tom-collins) uses 22 ml lemon, 15 ml rich, about 52 ml soda. [IBA John Collins](https://iba-world.com/iba-cocktail/john-collins/) uses 30 ml lemon, 15 ml simple, 60 ml soda. Both work out near 0.8 to 1.0% acid by my estimate, so long drinks with alcohol are not always low in acid.

**What happens without alcohol. Sources are mixed.**

- Brian Evans of Hotel Chelsea, [in Food Republic](https://www.foodrepublic.com/1729061/how-to-convert-cocktails-mocktails/): raise the sugar and lower the citrus.
- [Helsinki Distilling](https://hdco.fi/news/what-no-alcohol-cocktails-are-actually-missing-and-how-to-fix-it/), a brand blog: without alcohol, sweet and sour can taste sharper. It suggests 2 sweet to 1 sour.
- [Crafted AF](https://www.craftedaf.com/academy/rebuilding-the-classics/rebuilding-the-sours), a brand site: the opposite. It says acid and sweetness are unaffected, and keeps 2 : 0.75 : 0.75.
- Lab: [Hellekant 1997](https://experts.umn.edu/en/publications/the-taste-of-ethanol-in-a-primate-model-i-chorda-tympani-nerve-re/) found ethanol suppressed acid-sensitive taste fibers in primates, and suggested this may partly explain alcohol's effect on sourness.
- Lab: [Zamora 2006](https://repositorio.uca.edu.ar/bitstream/123456789/15217/1/sourness-sweetness-interaction.pdf) found fructose had a small suppressing effect on sourness, while acid strongly suppressed sweetness. It used tartaric acid at wine-like levels, not lemon juice.
- [Good Drinks recipes](https://sunset.com/recipe/nectar-of-the-gods): Nectar of the Gods (Minetta Gould) is 2 grapefruit, 0.75 lemon, 0.5 brine, 0.5 simple, 5 to 6 soda. My estimate is about 0.9% acid and 5.5:1. [Billows & Thieves](https://wnyc.org/story/alcohol-free-drink-recipes-julia-bainbridge) is 3 grapefruit, 0.5 lemon, 0.5 maple-based syrup. Naren Young's Salted Rosemary Paloma was seen only in a search result, at about 0.5 lime, 2 to 3 grapefruit, 0.5 syrup, 3 soda, so treat it as unconfirmed.

**Acid data.**

- [Penniston 2008](https://pubmed.ncbi.nlm.nih.gov/18290732/): citric acid 1.44 g/oz in lemon juice and 1.38 g/oz in lime, or about 4.9% and 4.7%. Lemonade and other juice products 0.03 to 0.22 g/oz, or about 0.1 to 0.7%.
- The 6% figure is the bar's titratable acidity, from Schramm on [VinePair](https://vinepair.com/cocktail-college/techniques-acid-adjusting/). It fits Arnold's numbers, so I used it to compare like with like. Using 4.9% lowers every lemon and lime acid figure here by about a fifth.
- [Soural 2022](https://cjfs.agriculturejournals.cz/pdfs/cjf/2022/01/08.pdf): pressed grapefruit juice 1.6% citric acid and about 1.0% titratable as reported, orange 0.7 to 0.8% titratable, apple about 0.5%. Arnold's Brown Derby implies about 2.2% for grapefruit, so 2% is my middle figure.
- Pineapple 0.8% comes from a [Modernist Pantry blog post](https://blog.modernistpantry.com/advice/how-to-acid-adjust-juices/) seen only in a search result. Tomato 0.45% is my conversion from a [student thesis](https://www.ukdr.uplb.edu.ph/etd-undergrad/12468), also seen only in a search result. Treat both as weak.
- [Trofin 2022](https://www.uaiasi.ro/revista_horti/files/Nr1_2022/vol%2065_1_2022%20(1).pdf): Coca-Cola 0.353 g citric acid per 100 ml on the Romanian market.
- [Barac 2023](https://publisher.medfak.ni.ac.rs/AMM_1/2023/2023-3-broj/celi_radovi/4Radomir%20Barac.pdf): Sprite pH 2.71, but its acidity units don't convert to a percent, so I have no lemon-lime acid figure.

**Lemonade.**

- [21 CFR 146.120](https://www.law.cornell.edu/cfr/text/21/146.120): lemonade from frozen concentrate must be at least 0.70 g acid per 100 ml and 10.5% soluble solids.
- [The Takeout](https://thetakeout.com/1658384/how-to-make-lemonade-juice) gives water, lemon and sugar at 3:1:1 to 6:1:1. It names no source. By my calculation that is 13 to 22% citrus share, 0.8 to 1.3% acid, 11 to 19 g sugar per 100 ml, and about 14:1.
- [Difford's lemonade](https://www.diffordsguide.com/cocktails/recipe/1650/real-lemonade) is much sharper at 59 ml lemon, 30 ml rich, 104 ml soda, or about 1.8% before melt.

**Sugar data.**

- USDA SR Legacy: [lemon juice](https://fdc.nal.usda.gov/food-details/167747/nutrients), [lime juice](https://fdc.nal.usda.gov/food-details/168156/nutrients), [honey](https://fdc.nal.usda.gov/food-details/169640/nutrients) (82% sugars, 40.9 fructose, 35.8 glucose), [agave](https://fdc.nal.usda.gov/food-details/170277/nutrients) (68%, 55.6 fructose, 12.4 glucose), [maple](https://fdc.nal.usda.gov/food-details/169661/nutrients) (60%, nearly all sucrose), [grenadine](https://fdc.nal.usda.gov/food-details/168088/nutrients) (46.6% sugars, 66.9% carbs), [white grapefruit juice](https://fdc.nal.usda.gov/food-details/173039/nutrients).
- Sodas and other juices come from the [SR28 nutrient](https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR/sr28/asc/NUT_DATA.txt) and [weight](https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR/sr28/asc/WEIGHT.txt) tables: ginger ale 8.9, tonic 8.8, lemon-lime 10.4, cola 9.9, prepared lemonade 10, all g per 100 g.
- Sweetness: [Wikipedia on fructose](https://en.wikipedia.org/wiki/Fructose) gives 1.2 to 1.8 times sucrose, citing Hanover and White 1993, which I did not read. It also says relative sweetness falls as temperature rises. Glucose at 74 and fructose at 163 come from an [American Bee Journal review](https://americanbeejournal.mydigitalpublication.com/april-2017-vol-157-no-4/page-395) seen only in a search result. The page would not load.
