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

export class Base {
  public owner: string;

  public name: string;
  public id: string;

  public position: Vec2;

  public cargo: storage.CargoHold;
  public fuel: storage.FuelTank;

  public constructor(
    owner: string,
    name: string,
    id: string,
    position: Vec2,
    cargo: storage.CargoHold = storage.CargoHold.empty(Infinity),
    fuel: storage.FuelTank = storage.FuelTank.empty(Infinity),
  ) {
    this.owner = owner;

    this.name = name;
    this.id = id;

    this.position = position;

    this.cargo = cargo;
    this.fuel = fuel;
  }

  public serialize(id: string | null): PackedBase {
    return {
      owner: this.owner,
      name: this.name,
      id: this.id,
      position: this.position.serialize(),
      cargo:
        id === null || id === this.owner
          ? this.cargo.serialize()
          : storage.CargoHold.empty(this.cargo.capacity).serialize(),
      fuel:
        id === null || id === this.owner
          ? this.fuel.serialize()
          : storage.FuelTank.empty(this.fuel.capacity).serialize(),
    };
  }
  public static deserialize(data: unknown): Base {
    if (typeof data !== "object")
      throw new UnpackError("base must be an object");
    if (data === null) throw new UnpackError("base must not be null");

    if (!typing.hasOwnProperty(data, "owner"))
      throw new UnpackError("base must have 'owner' property");
    if (!(typeof data.owner === "string"))
      throw new UnpackError("base owner must be a string");

    if (!typing.hasOwnProperty(data, "name"))
      throw new UnpackError("base must have 'name' property");
    if (!(typeof data.name === "string"))
      throw new UnpackError("base name must be a string");

    if (!typing.hasOwnProperty(data, "id"))
      throw new UnpackError("base must have 'id' property");
    if (!(typeof data.id === "string"))
      throw new UnpackError("base id must be a string");

    if (!typing.hasOwnProperty(data, "position"))
      throw new UnpackError("base must have 'position' property");

    if (!typing.hasOwnProperty(data, "cargo"))
      throw new UnpackError("base must have 'cargo' property");

    if (!typing.hasOwnProperty(data, "fuel"))
      throw new UnpackError("base must have 'fuel' property");

    return new Base(
      data.owner,
      data.name,
      data.id,
      Vec2.deserialize(data.position),
      storage.CargoHold.deserialize(data.cargo),
      storage.FuelTank.deserialize(data.fuel),
    );
  }
}
export interface PackedBase {
  owner: string;
  name: string;
  id: string;
  position: vec2.PackedVec2;
  cargo: storage.PackedCargoHold;
  fuel: storage.PackedFuelTank;
}

export class Outpost {
  public owner: string;

  public name: string;
  public id: string;

  public position: Vec2;

  public cargo: storage.CargoHold;
  public fuel: storage.FuelTank;

  public constructor(
    owner: string,
    name: string,
    id: string,
    position: Vec2,
    cargo: storage.CargoHold = storage.CargoHold.empty(Infinity),
    fuel: storage.FuelTank = storage.FuelTank.empty(Infinity),
  ) {
    this.owner = owner;

    this.name = name;
    this.id = id;

    this.position = position;

    this.cargo = cargo;
    this.fuel = fuel;
  }

  public serialize(id: string | null): PackedBase {
    return {
      owner: this.owner,
      name: this.name,
      id: this.id,
      position: this.position.serialize(),
      cargo:
        id === null || id === this.owner
          ? this.cargo.serialize()
          : storage.CargoHold.empty(this.cargo.capacity).serialize(),
      fuel:
        id === null || id === this.owner
          ? this.fuel.serialize()
          : storage.FuelTank.empty(this.fuel.capacity).serialize(),
    };
  }
  public static deserialize(data: unknown): Outpost {
    if (typeof data !== "object")
      throw new UnpackError("outpost must be an object");
    if (data === null) throw new UnpackError("outpost must not be null");

    if (!typing.hasOwnProperty(data, "owner"))
      throw new UnpackError("outpost must have 'owner' property");
    if (!(typeof data.owner === "string"))
      throw new UnpackError("outpost owner must be a string");

    if (!typing.hasOwnProperty(data, "name"))
      throw new UnpackError("outpost must have 'name' property");
    if (!(typeof data.name === "string"))
      throw new UnpackError("outpost name must be a string");

    if (!typing.hasOwnProperty(data, "id"))
      throw new UnpackError("outpost must have 'id' property");
    if (!(typeof data.id === "string"))
      throw new UnpackError("outpost id must be a string");

    if (!typing.hasOwnProperty(data, "position"))
      throw new UnpackError("outpost must have 'position' property");

    if (!typing.hasOwnProperty(data, "cargo"))
      throw new UnpackError("outpost must have 'cargo' property");

    if (!typing.hasOwnProperty(data, "fuel"))
      throw new UnpackError("outpost must have 'fuel' property");

    return new Outpost(
      data.owner,
      data.name,
      data.id,
      Vec2.deserialize(data.position),
      storage.CargoHold.deserialize(data.cargo),
      storage.FuelTank.deserialize(data.fuel),
    );
  }
}
export interface PackedOutpost {
  owner: string;
  name: string;
  id: string;
  position: vec2.PackedVec2;
  cargo: storage.PackedCargoHold;
  fuel: storage.PackedFuelTank;
}
