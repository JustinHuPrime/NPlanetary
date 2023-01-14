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

import * as typing from "../util/typing";
import UnpackError from "../util/unpackError";

export class CargoHold {
  public capacity: number;
  public money: number;
  public mines: number;
  public torpedoes: number;
  public nukes: number;
  public outposts: number;
  public ore: number;
  public bases: number;

  public constructor(
    capacity: number,
    money: number,
    mines: number,
    torpedoes: number,
    nukes: number,
    outposts: number,
    ore: number,
    bases: number,
  ) {
    this.capacity = capacity;
    this.money = money;
    this.mines = mines;
    this.torpedoes = torpedoes;
    this.nukes = nukes;
    this.outposts = outposts;
    this.ore = ore;
    this.bases = bases;
  }

  public static empty(capacity: number) {
    return new CargoHold(capacity, 0, 0, 0, 0, 0, 0, 0);
  }

  public serialize(): PackedCargoHold {
    return {
      capacity: Number.isFinite(this.capacity) ? this.capacity : "Infinity",
      money: this.money,
      mines: this.mines,
      torpedoes: this.torpedoes,
      nukes: this.nukes,
      outposts: this.outposts,
      ore: this.ore,
      bases: this.bases,
    };
  }
  public static deserialize(data: unknown): CargoHold {
    if (typeof data !== "object")
      throw new UnpackError("cargo hold must be an object");
    if (data === null) throw new UnpackError("cargo hold must not be null");

    if (!typing.hasOwnProperty(data, "capacity"))
      throw new UnpackError("cargo hold must have 'capacity' property");
    if (
      !(
        (typeof data.capacity === "number" &&
          Number.isInteger(data.capacity)) ||
        data.capacity === "Infinity"
      )
    )
      throw new UnpackError(
        "cargo hold capacity must be an integer or 'Infinity'",
      );

    if (!typing.hasOwnProperty(data, "money"))
      throw new UnpackError("cargo hold must have 'money' property");
    if (!(typeof data.money === "number" && Number.isInteger(data.money)))
      throw new UnpackError("cargo hold money must be an integer");

    if (!typing.hasOwnProperty(data, "mines"))
      throw new UnpackError("cargo hold must have 'mines' property");
    if (!(typeof data.mines === "number" && Number.isInteger(data.mines)))
      throw new UnpackError("cargo hold mines must be an integer");

    if (!typing.hasOwnProperty(data, "torpedoes"))
      throw new UnpackError("cargo hold must have 'torpedoes' property");
    if (
      !(typeof data.torpedoes === "number" && Number.isInteger(data.torpedoes))
    )
      throw new UnpackError("cargo hold torpedoes must be an integer");

    if (!typing.hasOwnProperty(data, "nukes"))
      throw new UnpackError("cargo hold must have 'nukes' property");
    if (!(typeof data.nukes === "number" && Number.isInteger(data.nukes)))
      throw new UnpackError("cargo hold nukes must be an integer");

    if (!typing.hasOwnProperty(data, "outposts"))
      throw new UnpackError("cargo hold must have 'outposts' property");
    if (!(typeof data.outposts === "number" && Number.isInteger(data.outposts)))
      throw new UnpackError("cargo hold outposts must be an integer");

    if (!typing.hasOwnProperty(data, "ore"))
      throw new UnpackError("cargo hold must have 'ore' property");
    if (!(typeof data.ore === "number" && Number.isInteger(data.ore)))
      throw new UnpackError("cargo hold ore must be an integer");

    if (!typing.hasOwnProperty(data, "bases"))
      throw new UnpackError("cargo hold must have 'bases' property");
    if (!(typeof data.bases === "number" && Number.isInteger(data.bases)))
      throw new UnpackError("cargo hold bases must be an integer");

    return new CargoHold(
      data.capacity === "Infinity" ? Infinity : data.capacity,
      data.money,
      data.mines,
      data.torpedoes,
      data.nukes,
      data.outposts,
      data.ore,
      data.bases,
    );
  }
}
export interface PackedCargoHold {
  capacity: number | "Infinity";
  money: number;
  mines: number;
  torpedoes: number;
  nukes: number;
  outposts: number;
  ore: number;
  bases: number;
}

export class FuelTank {
  public capacity: number;
  public fuel: number;

  public constructor(capacity: number, fuel: number) {
    this.capacity = capacity;
    this.fuel = fuel;
  }

  public static empty(capacity: number) {
    return new FuelTank(capacity, 0);
  }
  public static full(capacity: number) {
    return new FuelTank(capacity, capacity);
  }

  public serialize(): PackedFuelTank {
    return {
      capacity: Number.isFinite(this.capacity) ? this.capacity : "Infinity",
      fuel: this.fuel,
    };
  }
  public static deserialize(data: unknown): FuelTank {
    if (typeof data !== "object")
      throw new UnpackError("fuel tank must be an object");
    if (data === null) throw new UnpackError("fuel tank must not be null");

    if (!typing.hasOwnProperty(data, "capacity"))
      throw new UnpackError("fuel tank must have 'capacity' property");
    if (
      !(
        (typeof data.capacity === "number" &&
          Number.isInteger(data.capacity)) ||
        data.capacity === "Infinity"
      )
    )
      throw new UnpackError(
        "fuel tank capacity must be an integer or 'Infinity'",
      );

    if (!typing.hasOwnProperty(data, "fuel"))
      throw new UnpackError("fuel tank must have 'fuel' property");
    if (!(typeof data.fuel === "number" && Number.isInteger(data.fuel)))
      throw new UnpackError("fuel tank fuel must be an integer");

    return new FuelTank(
      data.capacity === "Infinity" ? Infinity : data.capacity,
      data.fuel,
    );
  }
}
export interface PackedFuelTank {
  capacity: number | "Infinity";
  fuel: number;
}
