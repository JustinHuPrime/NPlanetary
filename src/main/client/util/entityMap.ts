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

import * as game from "../../common/game/game";
import Vec2 from "../../common/util/vec2";

export default class EntityMap {
  private map: Map<number, Map<number, Array<game.Entity>>>;

  public constructor(state: game.Game) {
    this.map = new Map();
    state.celestials.forEach((celestial, _index, _array) => {
      this.addToEntityMap(celestial);
      if (celestial instanceof game.OrbitableBody) {
        celestial.orbitalBases.forEach((base, _index, _array) => {
          if (base) this.addToEntityMap(base);
        });
      }
      if (celestial instanceof game.LandableBody) {
        celestial.surfaceBases.forEach((base, _index, _array) => {
          if (base) this.addToEntityMap(base);
        });
      }
      if (celestial instanceof game.MinorBody && celestial.surfaceBase) {
        this.addToEntityMap(celestial.surfaceBase);
      }
    });
    state.asteroids.forEach((asteroid, _index, _value) => {
      this.addToEntityMap(asteroid);
      if (asteroid.outpost) this.addToEntityMap(asteroid.outpost);
    });
    state.ships.forEach((ship, _index, _array) => this.addToEntityMap(ship));
    state.ordnance.forEach((ordnance, _index, _array) =>
      this.addToEntityMap(ordnance),
    );
  }

  public get(hex: Vec2): Array<game.Entity> {
    return this.map.get(hex.q)?.get(hex.r) ?? [];
  }

  private addToEntityMap(entity: game.Entity) {
    if (!this.map.has(entity.position.q)) {
      this.map.set(entity.position.q, new Map());
    }

    const cascadeMap = this.map.get(entity.position.q)!;
    if (!cascadeMap.has(entity.position.r)) {
      cascadeMap.set(entity.position.r, []);
    }

    const array = cascadeMap.get(entity.position.r)!;
    array.push(entity);
  }
}
