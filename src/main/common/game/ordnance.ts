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
import Vec2, * as vec2 from "../util/vec2";

export const TTL = 5;

export enum OrdnanceType {
  MINE = "M",
  TORPEDO = "T",
  NUKE = "N",
}
export function isOrdnanceType(s: unknown): s is OrdnanceType {
  return typeof s === "string" && s in OrdnanceType;
}

export class Ordnance {
  public owner: string;

  public id: string;

  public position: Vec2;
  public velocity: Vec2;

  public ttl: number;

  public type: OrdnanceType;

  public constructor(
    owner: string,
    id: string,
    position: Vec2,
    velocity: Vec2,
    ttl: number = TTL,
    type: OrdnanceType,
  ) {
    this.owner = owner;

    this.id = id;

    this.position = position;
    this.velocity = velocity;

    this.ttl = ttl;

    this.type = type;
  }

  public serialize(id: string | null): PackedOrdnance {
    return {
      owner: this.owner,
      id: this.id,
      position: this.position.serialize(),
      velocity: this.velocity.serialize(),
      ttl: id === this.owner ? this.ttl : 0,
      type: this.type,
    };
  }
  public static deserialize(data: unknown): Ordnance {
    if (typeof data !== "object")
      throw new UnpackError("ordnance must be an object");
    if (data === null) throw new UnpackError("ordnance must not be null");

    if (!typing.hasOwnProperty(data, "owner"))
      throw new UnpackError("ordnance must have 'owner' property");
    if (!(typeof data.owner === "string"))
      throw new UnpackError("ordnance owner must be a string");

    if (!typing.hasOwnProperty(data, "id"))
      throw new UnpackError("ordnance must have 'id' property");
    if (!(typeof data.id === "string"))
      throw new UnpackError("ordnance id must be a string");

    if (!typing.hasOwnProperty(data, "position"))
      throw new UnpackError("ordnance must have 'position' property");

    if (!typing.hasOwnProperty(data, "velocity"))
      throw new UnpackError("ordnance must have 'position' property");

    if (!typing.hasOwnProperty(data, "ttl"))
      throw new UnpackError("ordnance must have 'ttl' property");
    if (!(typeof data.ttl === "number" && Number.isInteger(data.ttl)))
      throw new UnpackError("ordnance ttl must be an integer");

    if (!typing.hasOwnProperty(data, "type"))
      throw new UnpackError("ordnance must have 'type' property");
    if (!isOrdnanceType(data.type))
      throw new UnpackError("ordnance type must be an OrdnanceType");

    return new Ordnance(
      data.owner,
      data.id,
      Vec2.deserialize(data.position),
      Vec2.deserialize(data.velocity),
      data.ttl,
      data.type,
    );
  }
}
export interface PackedOrdnance {
  owner: string;

  id: string;

  position: vec2.PackedVec2;
  velocity: vec2.PackedVec2;

  ttl: number;

  type: OrdnanceType;
}
