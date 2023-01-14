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

import * as storage from "./storage";
import * as typing from "../util/typing";
import UnpackError from "../util/unpackError";
import Vec2, * as vec2 from "../util/vec2";

export class Ship {
  public static MAX_HEALTH = 6;

  public owner: string;

  public name: string;
  public id: string;

  public type: string;
  public isWarship: boolean;

  public position: Vec2;
  public velocity: Vec2;

  public strength: number;
  public isDefensive: boolean;

  public cargo: storage.CargoHold;
  public fuel: storage.FuelTank;

  public overloaded: boolean;

  public weaponHealth: number;
  public driveHealth: number;
  public structureHealth: number;

  public constructor(
    owner: string,
    name: string,
    id: string,
    type: string,
    isWarship: boolean,
    position: Vec2,
    velocity: Vec2,
    strength: number,
    isDefensive: boolean,
    cargo: storage.CargoHold,
    fuel: storage.FuelTank,
    overloaded: boolean = false,
    weaponHealth: number = Ship.MAX_HEALTH,
    driveHealth: number = Ship.MAX_HEALTH,
    structureHealth: number = Ship.MAX_HEALTH,
  ) {
    this.owner = owner;

    this.name = name;
    this.id = id;

    this.type = type;
    this.isWarship = isWarship;

    this.position = position;
    this.velocity = velocity;

    this.strength = strength;
    this.isDefensive = isDefensive;

    this.cargo = cargo;
    this.fuel = fuel;

    this.overloaded = overloaded;

    this.weaponHealth = weaponHealth;
    this.driveHealth = driveHealth;
    this.structureHealth = structureHealth;
  }

  public serialize(id: string | null): PackedShip {
    return {
      owner: this.owner,
      name: this.name,
      id: this.id,
      type: this.type,
      isWarship: this.isWarship,
      position: this.position.serialize(),
      velocity: this.velocity.serialize(),
      strength: this.strength,
      isDefensive: this.isDefensive,
      cargo:
        id === this.owner
          ? this.cargo.serialize()
          : storage.CargoHold.empty(this.cargo.capacity).serialize(),
      fuel:
        id === this.owner
          ? this.fuel.serialize()
          : storage.FuelTank.empty(this.fuel.capacity).serialize(),
      overloaded: id === this.owner ? this.overloaded : false,
      weaponHealth: this.weaponHealth,
      driveHealth: this.driveHealth,
      structureHealth: this.structureHealth,
    };
  }
  public static deserialize(data: unknown): Ship {
    if (typeof data !== "object")
      throw new UnpackError("ship must be an object");
    if (data === null) throw new UnpackError("ship must not be null");

    if (!typing.hasOwnProperty(data, "owner"))
      throw new UnpackError("ship must have 'owner' property");
    if (!(typeof data.owner === "string"))
      throw new UnpackError("ship owner must be a string");

    if (!typing.hasOwnProperty(data, "name"))
      throw new UnpackError("ship must have 'name' property");
    if (!(typeof data.name === "string"))
      throw new UnpackError("ship name must be a string");

    if (!typing.hasOwnProperty(data, "id"))
      throw new UnpackError("ship must have 'id' property");
    if (!(typeof data.id === "string"))
      throw new UnpackError("ship id must be a string");

    if (!typing.hasOwnProperty(data, "type"))
      throw new UnpackError("ship must have 'type' property");
    if (!(typeof data.type === "string"))
      throw new UnpackError("ship type must be a string");

    if (!typing.hasOwnProperty(data, "isWarship"))
      throw new UnpackError("ship must have 'isWarship' property");
    if (!(typeof data.isWarship === "boolean"))
      throw new UnpackError("ship isWarship must be a boolean");

    if (!typing.hasOwnProperty(data, "position"))
      throw new UnpackError("ship must have 'position' property");

    if (!typing.hasOwnProperty(data, "velocity"))
      throw new UnpackError("ship must have 'velocity' property");

    if (!typing.hasOwnProperty(data, "strength"))
      throw new UnpackError("ship must have 'strength' property");
    if (!(typeof data.strength === "number" && Number.isInteger(data.strength)))
      throw new UnpackError("ship strength must be an integer");

    if (!typing.hasOwnProperty(data, "isDefensive"))
      throw new UnpackError("ship must have 'isDefensive' property");
    if (!(typeof data.isDefensive === "boolean"))
      throw new UnpackError("ship isDefensive must be a boolean");

    if (!typing.hasOwnProperty(data, "cargo"))
      throw new UnpackError("ship must have 'cargo' property");

    if (!typing.hasOwnProperty(data, "fuel"))
      throw new UnpackError("ship must have 'fuel' property");

    if (!typing.hasOwnProperty(data, "overloaded"))
      throw new UnpackError("ship must have 'overloaded' property");
    if (!(typeof data.overloaded === "boolean"))
      throw new UnpackError("ship overloaded must be a boolean");

    if (!typing.hasOwnProperty(data, "weaponHealth"))
      throw new UnpackError("ship must have 'weaponHealth' property");
    if (
      !(
        typeof data.weaponHealth === "number" && Number.isInteger(data.strength)
      )
    )
      throw new UnpackError("ship weaponHealth must be an integer");

    if (!typing.hasOwnProperty(data, "driveHealth"))
      throw new UnpackError("ship must have 'driveHealth' property");
    if (
      !(typeof data.driveHealth === "number" && Number.isInteger(data.strength))
    )
      throw new UnpackError("ship driveHealth must be an integer");

    if (!typing.hasOwnProperty(data, "structureHealth"))
      throw new UnpackError("ship must have 'structureHealth' property");
    if (
      !(
        typeof data.structureHealth === "number" &&
        Number.isInteger(data.strength)
      )
    )
      throw new UnpackError("ship structureHealth must be an integer");

    return new Ship(
      data.owner,
      data.name,
      data.id,
      data.type,
      data.isWarship,
      Vec2.deserialize(data.position),
      Vec2.deserialize(data.velocity),
      data.strength,
      data.isDefensive,
      storage.CargoHold.deserialize(data.cargo),
      storage.FuelTank.deserialize(data.fuel),
      data.overloaded,
      data.weaponHealth,
      data.driveHealth,
      data.structureHealth,
    );
  }
}
export interface PackedShip {
  owner: string;

  name: string;
  id: string;

  type: string;
  isWarship: boolean;

  position: vec2.PackedVec2;
  velocity: vec2.PackedVec2;

  strength: number;
  isDefensive: boolean;

  cargo: storage.PackedCargoHold;
  fuel: storage.PackedFuelTank;

  overloaded: boolean;

  weaponHealth: number;
  driveHealth: number;
  structureHealth: number;
}
