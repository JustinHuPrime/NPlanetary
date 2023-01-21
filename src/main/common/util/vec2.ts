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

import UnpackError from "./unpackError";
import * as typing from "./typing";

export default class Vec2 {
  public q: number;
  public r: number;

  public constructor(q: number, r: number) {
    this.q = q;
    this.r = r;
  }
  public clone(): Vec2 {
    return new Vec2(this.q, this.r);
  }

  public static distance(a: Vec2, b: Vec2): number {
    const ax = a.q;
    const ay = a.r;
    const az = -ax - ay;

    const bx = b.q;
    const by = b.r;
    const bz = -bx - by;

    return Math.max(Math.abs(ax - bx), Math.abs(ay - by), Math.abs(az - bz));
  }

  public toScreen(scale: number): { x: number; y: number } {
    return {
      x: scale * (Math.sqrt(3) * this.q + (Math.sqrt(3) / 2) * this.r),
      y: scale * ((3 / 2) * this.r),
    };
  }
  public static toScreen(
    q: number,
    r: number,
    scale: number,
  ): { x: number; y: number } {
    return {
      x: scale * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r),
      y: scale * ((3 / 2) * r),
    };
  }

  public adjacent(): Vec2[] {
    return [
      new Vec2(this.q + 1, this.r),
      new Vec2(this.q, this.r + 1),
      new Vec2(this.q - 1, this.r + 1),
      new Vec2(this.q - 1, this.r),
      new Vec2(this.q, this.r - 1),
      new Vec2(this.q + 1, this.r - 1),
    ];
  }

  public serialize(): PackedVec2 {
    return {
      q: this.q,
      r: this.r,
    };
  }
  public static deserialize(data: unknown): Vec2 {
    if (typeof data !== "object")
      throw new UnpackError("vec2 must be an object");
    if (data === null) throw new UnpackError("vec2 must not be null");

    if (!typing.hasOwnProperty(data, "q"))
      throw new UnpackError("vec2 must have 'q' property");
    if (!(typeof data.q === "number"))
      throw new UnpackError("vec2 q must be a number");

    if (!typing.hasOwnProperty(data, "r"))
      throw new UnpackError("vec2 must have 'r' property");
    if (!(typeof data.r === "number"))
      throw new UnpackError("vec2 r must be a number");

    return new Vec2(data.q, data.r);
  }
}
export interface PackedVec2 {
  q: number;
  r: number;
}
