// Copyright 2023 Justin Hu
//
// This file is part of NPlanetary.
//
// NPlanetary is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option)
// any later version.
//
// NPlanetary is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
// for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with NPlanetary. If not, see <https://www.gnu.org/licenses/>.
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import UnpackError from "../util/unpackError";
import * as typing from "../util/typing";
import * as celestial from "./celestial";
import * as ship from "./ship";
import * as ordnance from "./ordnance";
import Vec2 from "../util/vec2";
import * as base from "./base";
import id from "../util/idGenerator";
import * as random from "../util/random";

export * from "./celestial";
export * from "./ship";
export * from "./ordnance";
export * from "./storage";
export * from "./base";

export class Game {
  public static MAP_LIMIT = 50;

  public static PLAYER_COLOURS = [
    "#0000ff",
    "#ff0000",
    "#00ff00",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
  ];

  public static PLAYER_CAPITALS = [
    "Washington",
    "Beijing",
    "Tokyo",
    "Berlin",
    "London",
    "New Delhi",
  ];
  public static STARTING_MONEY = 25;

  public numPlayers: number;
  public playerNames: string[];
  public playerIds: string[];

  public celestials: celestial.CelestialBody[];
  public asteroids: celestial.AsteroidCluster[];
  public ships: ship.Ship[];
  public ordnance: ordnance.Ordnance[];

  public constructor(
    numPlayers: number,
    playerNames: string[] = [],
    playerIds: string[],
    celestials: celestial.CelestialBody[],
    asteroids: celestial.AsteroidCluster[],
    ships: ship.Ship[] = [],
    ordnance: ordnance.Ordnance[] = [],
  ) {
    this.numPlayers = numPlayers;
    this.playerNames = playerNames;
    this.playerIds = playerIds;
    this.celestials = celestials;
    this.asteroids = asteroids;
    this.ships = ships;
    this.ordnance = ordnance;
  }

  public static setup(numPlayers: number): Game {
    let game = new Game(
      numPlayers,
      [],
      [...new Array(numPlayers)].map((_value, _index, _array) => {
        return id();
      }),
      [
        new celestial.CelestialBody(
          "Sol",
          id(),
          new Vec2(0, 0),
          0.8,
          "#ffff00",
        ),
        new celestial.LandableBody(
          "Mercury",
          id(),
          new Vec2(1, 3),
          0.3,
          "#404040",
        ),
        new celestial.LandableBody(
          "Venus",
          id(),
          new Vec2(-8, 4),
          0.6,
          "#ffc000",
        ),
        new celestial.LandableBody(
          "Terra",
          id(),
          new Vec2(13, -6),
          0.6,
          "#0000ff",
        ),
        new celestial.LandableBody(
          "Luna",
          id(),
          new Vec2(16, -7),
          0.4,
          "#808080",
        ),
        new celestial.LandableBody(
          "Mars",
          id(),
          new Vec2(1, -20),
          0.5,
          "#ff0000",
        ),
        new celestial.MinorBody(
          "Ceres",
          id(),
          new Vec2(22, -26),
          0.3,
          "#808080",
        ),
        new celestial.MinorBody(
          "Vesta",
          id(),
          new Vec2(-2, 26),
          0.3,
          "#808080",
        ),
        new celestial.OrbitableBody(
          "Jupiter",
          id(),
          new Vec2(20, -42),
          0.8,
          "#ffc000",
        ),
        new celestial.LandableBody(
          "Europa",
          id(),
          new Vec2(20, -39),
          0.3,
          "#a0a0ff",
        ),
        new celestial.LandableBody(
          "Callisto",
          id(),
          new Vec2(16, -42),
          0.3,
          "#404040",
        ),
        new celestial.LandableBody(
          "Ganymede",
          id(),
          new Vec2(24, -44),
          0.3,
          "#404040",
        ),
      ],
      [],
      [],
      [],
    );

    // terra bases
    const terra = game.celestials[3] as celestial.LandableBody;
    for (let idx = 0; idx < numPlayers; ++idx) {
      const terraBase = new base.Base(
        game.playerIds[idx] as string,
        Game.PLAYER_CAPITALS[idx] as string,
        id(),
        terra.position.clone(),
      );
      terraBase.cargo.money = Game.STARTING_MONEY;
      terra.surfaceBases[idx] = terraBase;
    }

    // asteroid belt
    for (
      let q = -celestial.AsteroidCluster.BELT_OUTER_RADIUS;
      q <= celestial.AsteroidCluster.BELT_OUTER_RADIUS;
      ++q
    ) {
      for (
        let r = Math.max(
          -celestial.AsteroidCluster.BELT_OUTER_RADIUS,
          -q - celestial.AsteroidCluster.BELT_OUTER_RADIUS,
        );
        r <=
        Math.min(
          celestial.AsteroidCluster.BELT_OUTER_RADIUS,
          -q + celestial.AsteroidCluster.BELT_OUTER_RADIUS,
        );
        ++r
      ) {
        const position = new Vec2(q, r);

        // too close to sun
        if (
          Vec2.distance(
            (game.celestials[0] as celestial.CelestialBody).position,
            position,
          ) < celestial.AsteroidCluster.BELT_INNER_RADIUS
        )
          continue;

        // too close to a body
        let tooClose = false;
        for (const body of game.celestials) {
          if (
            Vec2.distance(body.position, position) <=
            (body instanceof celestial.MinorBody
              ? 0
              : celestial.AsteroidCluster.BELT_BODY_STANDOFF)
          ) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) continue;

        // random chance
        if (Math.random() > celestial.AsteroidCluster.BELT_DENSITY) continue;

        game.asteroids.push(
          new celestial.AsteroidCluster(
            id(),
            position,
            ((roll) => {
              switch (roll) {
                case 1:
                  return celestial.ResourceType.ICE;
                case 6:
                  return celestial.ResourceType.ORE;
                default:
                  return celestial.ResourceType.NONE;
              }
            })(random.d6()),
          ),
        );
      }
    }

    return game;
  }

  public isFull(): boolean {
    return this.playerNames.length >= this.numPlayers;
  }

  public serialize(id: string | null): PackedGame {
    return {
      numPlayers: this.numPlayers,
      playerNames: this.playerNames,
      playerIds: this.playerIds,
      celestials: this.celestials.map((value, _index, _array) => {
        return value.serialize(id);
      }),
      asteroids: this.asteroids.map((value, _index, _array) => {
        return value.serialize(id);
      }),
      ships: this.ships.map((value, _index, _array) => {
        return value.serialize(id);
      }),
      ordnance: this.ordnance.map((value, _index, _array) => {
        return value.serialize(id);
      }),
    };
  }
  public static deserialize(data: unknown): Game {
    if (typeof data !== "object")
      throw new UnpackError("game must be an object");
    if (data === null) throw new UnpackError("game must not be null");

    if (!typing.hasOwnProperty(data, "numPlayers"))
      throw new UnpackError("game must have 'numPlayers' property");
    if (
      !(
        typeof data.numPlayers === "number" && Number.isInteger(data.numPlayers)
      )
    )
      throw new UnpackError("game numPlayers must be an integer");

    if (!typing.hasOwnProperty(data, "playerNames"))
      throw new UnpackError("game must have 'playerNames' property");
    if (
      !(
        Array.isArray(data.playerNames) &&
        data.playerNames.every((value, _index, _array) => {
          return typeof value === "string";
        })
      )
    )
      throw new UnpackError("game playerNames must be an array of strings");

    if (!typing.hasOwnProperty(data, "playerIds"))
      throw new UnpackError("game must have 'playerIds' property");
    if (
      !(
        Array.isArray(data.playerIds) &&
        data.playerIds.every((value, _index, _array) => {
          return typeof value === "string";
        })
      )
    )
      throw new UnpackError("game playerIds must be an array of strings");

    if (!typing.hasOwnProperty(data, "celestials"))
      throw new UnpackError("game must have 'celestials' property");
    if (!Array.isArray(data.celestials))
      throw new UnpackError("game celestials must be an array");

    if (!typing.hasOwnProperty(data, "asteroids"))
      throw new UnpackError("game must have 'asteroids' property");
    if (!Array.isArray(data.asteroids))
      throw new UnpackError("game asteroids must be an array");

    if (!typing.hasOwnProperty(data, "ships"))
      throw new UnpackError("game must have 'ships' property");
    if (!Array.isArray(data.ships))
      throw new UnpackError("game ships must be an array");

    if (!typing.hasOwnProperty(data, "ordnance"))
      throw new UnpackError("game must have 'ordnance' property");
    if (!Array.isArray(data.ordnance))
      throw new UnpackError("game ordnance must be an array");

    return new Game(
      data.numPlayers,
      data.playerNames,
      data.playerIds,
      data.celestials.map((value, _index, _array) => {
        return celestial.CelestialBody.deserialize(value);
      }),
      data.asteroids.map((value, _index, _array) => {
        return celestial.AsteroidCluster.deserialize(value);
      }),
      data.ships.map((value, _index, _array) => {
        return ship.Ship.deserialize(value);
      }),
      data.ordnance.map((value, _index, _array) => {
        return ordnance.Ordnance.deserialize(value);
      }),
    );
  }
}
export interface PackedGame {
  numPlayers: number;
  playerNames: string[];
  playerIds: string[];
  celestials: celestial.PackedCelestialBody[];
  asteroids: celestial.PackedAsteroidCluster[];
  ships: ship.PackedShip[];
  ordnance: ordnance.PackedOrdnance[];
}
