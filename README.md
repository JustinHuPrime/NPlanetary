# NPlanetary

Version 0.1.9

A game of logistics and combat in the solar system

## Game Rules

### Ships

There are eight different kinds of ships - two civilian and six military:

- Freighters are unarmoured and unarmed civilian ships for hauling dry goods like ore or supplies. A freighter has a combat strength of 1 (defensive), stores 10 points of fuel, may hold 50 points of cargo, and costs 10 supplies. <!-- Design note: baseline freighter ship -->
- Tankers are similarly unarmoured and unarmed civilian ships, but for transport of liquids like fuel or water. A tanker also has a combat strength of 1 (defensive), stores 50 points of fuel, may not hold any cargo, and also costs 10 supplies. <!-- Design note: baseline tanker ship -->
- Transports are lightly armed military vessels for hauling dry goods. A transport has a combat strength of 1 (and may attack), stores 10 points of fuel, may hold 50 points of cargo, and costs 20 supplies. <!-- Design note: upgraded freighter ship; 2x cost for ability to attack -->
- Oilers are lightly armed military vessels primarily for transport of fuel. An oiler has a combat strength of 1 (and may attack), stores 50 points of fuel, may not hold any cargo, and costs 20 supplies. <!-- Design note: upgraded tanker ship; 2x cost for ability to attack -->
- Frigates are lightly armed military vessels primarily intended for patrol duties. A frigate has a combat strength of 2, stores 15 points of fuel, may hold 10 points of cargo, and costs 40 supplies. <!-- Design note: baseline military ship -->
- Destroyers are moderately armed military vessels intended for escorting more vulnerable ships. A destroyer has a combat strength of 3, stores 15 points of fuel, may hold 10 points of cargo, and costs 60 supplies. <!-- Design note: simple upgrade to frigate -->
- Cruisers are moderately armed and long endurance military vessels. A cruiser has a combat strength of 5, stores 20 points of fuel, may hold 15 points of cargo, and costs 100 supplies. <!-- Design note: extended hold and tankage; best bang-for-buck -->
- Battleships are heavily armed but slow military vessels intended for direct fleet combat. A battleship has a combat strength of 10, stores 10 points of fuel, may hold 30 points of cargo, and costs 150 supplies. <!-- Design note: cheap relative to direct combat strength but smaller fuel tankage -->

### Phases

NPlanetary can be played with up to six players; each player will submit their orders simultaneously and orders will be resolved simultaneously.

A turn consists of 5 phases, during which everyone will issue a different kind of order.

1. Ordnance, when the player may launch ordnance from their ship

2. Combat, when ships and other entities may attack

3. Movement, when the player may issue movement orders to ships - note that if you issued an ordnance launch order for a mine or a nuke, you must issue a movement order in this phase or your ship will be hit by your own ordnance; ships and other entities move after this phase

4. Development, when ships are bought and installations are deployed

5. Logistics, when ships and other entities may transfer and sell cargo, when ships are bought, and installations are deployed

Note that you will be not be asked for orders if you cannot give any, and if no players can give orders in a phase no player will be asked to do so.

### Ordnance

There are three kinds of ordnance:

- Mines are small bomb-pumped lasers that will detonate against any ship that crosses their path. A mine is one point of cargo and costs 2 supplies.
- Torpedoes are long-range guided missiles carrying a casaba howitzer warhead. A torpedo is two points of cargo and costs 4 supplies.
- Nukes are large strategic bombardment weapons similar to mines that will devastate anything hit. A nuke is two points of cargo and costs 40 supplies.

During the ordnance phase, any ship that may attack (i.e. is not a civilian ship and does not have weapons damaged) may deploy one piece of ordnance carried. The ordnance inherits the ship's velocity and position, except for torpedoes, which may change their vector by one or two hexes on the first turn after deployment. (Note that while ships may deploy ordnance with drives disabled, unless a torpedo was deployed, the ship will be hit by the ordnance during the movement phase.)

A piece of ordnance will detonate if its closest approach (accounting for velocity) to another ship is within half a hex, excluding the deploying ship on the first turn only.

Ordnance will prefer to attack the first object encountered, breaking in encounter order from largest to smallest object (bases are considered the largest objects, then battleships through frigates, ordered descending by combat strength, and finally freighters, tankers, transports, and oilers are tied for smallest object), and finally breaking ties in size randomly. No piece of ordnance will attempt to attack more than one target.

Ordnance will persist until destroyed, either by leaving the map, collision, or attack.

When a piece of ordnance makes an attack against a ship or station (ordnance does not hit other ordnance), if the ordnance is a nuke, destroy the target. For all other ordnance, roll 1d6 and take the velocity between the ordnance and the target; when the net velocity (keeping the target fixed) is towards the target, for each hex per turn, add one; when the net velocity is away from the target, subtract one; for angles in between apply cosine losses. Finally, round to a whole number.

For torpedoes:

- For rolls of 1 or less, deal no damage
- For rolls between 2 and 6, roll once on the damage table (see the Combat section)
- For rolls of 6 or more, or when attacking a ship with disabled drives, roll thrice on the damage table

For mines:

- For rolls of 4 or less, deal no damage
- For rolls of 5, roll once on the damage table
- For rolls of 6 or more, or when attacking a ship with disabled drives, roll twice on the damage table

### Combat

A ship or base may be ordered to attack any number of ships, bases, or items of ordnance belonging to anyone (including the owning player), up to their combat strength, if they have functional weapons, so long as a line drawn between the ship and the target does not intersect any celestial body (excluding asteroids). Ships may also use less than their total combat strength when attacking (maybe you want to fire a warning shot).

For each attacker, split the combat strength to be applied to the target into equal portions. Take the fraction of combat strength for the target, and add the following modifiers, with a minimum result of zero:

- for each hex between attacker and defender, subtract one
- take the velocity between the attacker and defender; when the net velocity (keeping the defender fixed) is towards the defender, for each hex per turn, add one; when the net velocity is away from the defender, subtract one; for angles in between, apply standard cosine losses.

Add the resulting strength to the tally of strength being applied to the target.

If the strength attacking a piece of ordnance is one or more, the piece of ordnance is destroyed. For each ship or base, compare the total strength attacking to the target's base combat strength.

- If the total attacking strength is less than a quarter of the defender's strength, no damage is dealt.
- If the total attacking strength is less than half of the defender's strength (but more than a quarter), roll 1d6, rolling once on the damage table on a result of 6.
- If the total attacking strength is less than the defender's strength (but more than half), roll 1d6, rolling once on the damage table on a result of 5 or 6.
- If the total attacking strength is less than twice the defender's strength (but more than the defender's strength), roll 1d6, rolling twice on the damage table on a result of 6, and once on a result of 4 or 5.
- If the total attacking strength is less than three times the defender's strength (but more than twice), roll 1d6, rolling twice on the damage table on a result of 5 or 6, and once on a result of 3 or 4.
- If the total attacking strength is less than four times the defender's strength (but more than thrice), roll 1d6, rolling thrice on the damage table on a result of 6, twice on a result of 4 or 5, and once on a result of 2 or 3.
- If the total attacking strength is four times or more than the defender's strength, roll 1d6, rolling thrice on the damage table on a result of 5 or 6, twice on the result of 3 or 4, and once on a result of 1 or 2.

For attacks against military ships, use the following damage table:

- On a roll of 1, deal 1 point of damage to weapons
- On a roll of 2, deal 1 point of damage to drives
- On a roll of 3, deal 1 point of damage to structure
- On a roll of 4, deal 1 point of damage to weapons and 1 point of damage to structure
- On a roll of 5, deal 1 point of damage to weapons and 1 point of damage to drives
- On a roll of 6, deal 1 point of damage to structure and 1 point of damage to drives

For attacks against civilian ships, use the following damage table:

- On a roll of 1, deal 1 point of damage to drives
- On a roll of 2 or 3, deal 1 point of damage to structure
- On a roll of 4, 5, or 6, deal 1 point of damage to drives and 1 point of damage to structure

For attacks against bases, use the following damage table:

- On a roll of 1, deal no damage
- On a roll of 2 or 3, deal 1 point of damage to weapons
- On a roll of 4 or 5, deal 1 point of damage to structure
- On a roll of 6, deal 1 point of damage to weapons and 1 point of damage to structure

### Movement

Ships may expend one point of fuel to change their vector by one hex per turn, except military ships (transports, oilers, and warships) may expend *four* points of fuel to change their vector by *two* hexes per turn.

Ships that have their vector pass through a planet are eliminated as they touch the planet on grounds of having crashed.

Finally, instead of the standard movement orders, ships may, when in orbit around a planet, spend one point of fuel to land at any base on the planet, or, for free, dock at any orbital base in orbit of the planet. Furthermore, ships may, when stationary relative to an asteroid base or an outpost, dock at said orbital base or outpost instead of a standard movement order.

Ships are affected by gravity when moving near planets. Gravity hexes will change the vector of the ship in the direction of the hex by one space, except for the hex the ship started from. The sectors of the hex near the planet also, individually, count as gravity hexes.

### Development

In this phase, any base may spend supplies to purchase cargo or ships; ships start docked to the base with no cargo and no fuel, and may be given orders during the upcoming logistics phase.

Furthermore, any ship may deploy an installation they have onboard:

A base may be deployed:

- in empty space (not on an asteroid)
- when in orbit of a planet (the base also orbits)
- when stationary at a minor body

An outpost may be deployed when stationary at an asteroid

### Logistics

In this phase, a base or ship may transfer any amount of cargo and/or fuel to or from any number of the following:

- any base the ship is docked to
- any ship also docked to the same base
- any ship in the same hex with the same velocity

Subject to the following conditions:

- the base or ship belongs to the same player as the transferring ship (and is either not transferring or is making the same transfer - see below), or
- the base or ship has both drive (if present) and weapons (if present) disabled (bases do not have drive health, nor do civilian ships have weapons health), or
- the base or ship belongs to another player who, that turn, has ordered the exact same transfer (e.g. if you order your ship to give 5 points of fuel and take 1 point of supplies, and your target ship was ordered to take 5 points of fuel and give 1 point of supplies, the transfer will go through; any mismatch in quantity or direction will cause the transfer to fail)

Note that identical transfers between the same pair of targets are deduplicated. For example, if my ship transfers 5 points of fuel from the base and the base transfers 5 points of fuel to the ship, it's treated as a single transfer of 5 points of fuel, not two independent transfers totalling to 10 points.

Any ore or water transferred to a base, yours or someone else's, is instantly converted into supplies or fuel at a 1:1 rate.

### End of Round

At the end of the round, each base on (but not in orbit of) any major or minor planet gains a unit of supplies. Each base on Earth, Europa, or Titan gains 1 point of fuel. Each outpost gains a unit of ore or a unit of water, depending on the composition of the asteroid.
