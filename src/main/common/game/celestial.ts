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
import Vec2, * as vec2 from "../util/vec2";
import * as typing from "../util/typing";
import * as base from "./base";

export class CelestialBody {
  public name: string;
  public id: string;

  public position: Vec2;

  public radius: number;
  public colour: string;

  public constructor(
    name: string,
    id: string,
    position: Vec2,
    radius: number,
    colour: string,
  ) {
    this.name = name;
    this.id = id;

    this.position = position;

    this.radius = radius;
    this.colour = colour;
  }

  public serialize(_id: string | null): PackedCelestialBody {
    return {
      name: this.name,
      id: this.id,
      position: this.position.serialize(),
      radius: this.radius,
      colour: this.colour,
    };
  }
  public static deserialize(data: unknown): CelestialBody {
    if (typeof data !== "object")
      throw new UnpackError("celestial body must be an object");
    if (data === null) throw new UnpackError("celestial body must not be null");

    if (!typing.hasOwnProperty(data, "name"))
      throw new UnpackError("celestial body must have 'name' property");
    if (!(typeof data.name === "string"))
      throw new UnpackError("celestial body name must be a string");

    if (!typing.hasOwnProperty(data, "id"))
      throw new UnpackError("celestial body must have 'id' property");
    if (!(typeof data.id === "string"))
      throw new UnpackError("celestial body id must be a string");

    if (!typing.hasOwnProperty(data, "position"))
      throw new UnpackError("celestial body must have 'position' property");

    if (!typing.hasOwnProperty(data, "radius"))
      throw new UnpackError("vec2 must have 'radius' property");
    if (!(typeof data.radius === "number"))
      throw new UnpackError("vec2 radius must be a number");

    if (!typing.hasOwnProperty(data, "colour"))
      throw new UnpackError("celestial body must have 'colour' property");
    if (
      !(
        typeof data.colour === "string" &&
        data.colour.match(/^#[0-9a-f]{6}$/) !== null
      )
    )
      throw new UnpackError(
        "celestial body colour must be a string of the form /^#[0-9a-f]{6}$/",
      );

    if (typing.hasOwnProperty(data, "surfaceBase")) {
      return new MinorBody(
        data.name,
        data.id,
        Vec2.deserialize(data.position),
        data.radius,
        data.colour,
        data.surfaceBase === null
          ? data.surfaceBase
          : base.Base.deserialize(data.surfaceBase),
      );
    } else if (
      typing.hasOwnProperty(data, "surfaceBases") &&
      Array.isArray(data.surfaceBases) &&
      typing.hasOwnProperty(data, "orbitalBases") &&
      Array.isArray(data.orbitalBases)
    ) {
      return new LandableBody(
        data.name,
        data.id,
        Vec2.deserialize(data.position),
        data.radius,
        data.colour,
        data.orbitalBases.map((value, _index, _array): base.Base | null => {
          return value === null ? null : base.Base.deserialize(value);
        }),
        data.surfaceBases.map((value, _index, _array): base.Base | null => {
          return value === null ? null : base.Base.deserialize(value);
        }),
      );
    } else if (
      typing.hasOwnProperty(data, "orbitalBases") &&
      Array.isArray(data.orbitalBases)
    ) {
      return new OrbitableBody(
        data.name,
        data.id,
        Vec2.deserialize(data.position),
        data.radius,
        data.colour,
        data.orbitalBases.map((value, _index, _array): base.Base | null => {
          return value === null ? null : base.Base.deserialize(value);
        }),
      );
    } else {
      return new CelestialBody(
        data.name,
        data.id,
        Vec2.deserialize(data.position),
        data.radius,
        data.colour,
      );
    }
  }
}
export interface PackedCelestialBody {
  name: string;
  id: string;

  position: vec2.PackedVec2;

  radius: number;
  colour: string;
}

export class OrbitableBody extends CelestialBody {
  public orbitalBases: Array<base.Base | null>;

  public constructor(
    name: string,
    id: string,
    position: Vec2,
    radius: number,
    colour: string,
    orbitalBases: Array<base.Base | null> = [
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  ) {
    super(name, id, position, radius, colour);
    this.orbitalBases = orbitalBases;
  }

  public override serialize(id: string | null): PackedOrbitableBody {
    return {
      ...super.serialize(id),
      orbitalBases: this.orbitalBases.map((base, _index, _array) => {
        return base === null ? null : base.serialize(id);
      }),
    };
  }
}
export interface PackedOrbitableBody extends PackedCelestialBody {
  orbitalBases: Array<base.PackedBase | null>;
}

export class LandableBody extends OrbitableBody {
  public surfaceBases: Array<base.Base | null>;

  public constructor(
    name: string,
    id: string,
    position: Vec2,
    radius: number,
    colour: string,
    orbitalBases: Array<base.Base | null> = [
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    surfaceBases: Array<base.Base | null> = [
      null,
      null,
      null,
      null,
      null,
      null,
    ],
  ) {
    super(name, id, position, radius, colour, orbitalBases);
    this.surfaceBases = surfaceBases;
  }

  public override serialize(id: string | null): PackedLandableBody {
    return {
      ...super.serialize(id),
      surfaceBases: this.surfaceBases.map((base, _index, _array) => {
        return base === null ? null : base.serialize(id);
      }),
    };
  }
}
export interface PackedLandableBody extends PackedOrbitableBody {
  surfaceBases: Array<base.PackedBase | null>;
}

export class MinorBody extends CelestialBody {
  public surfaceBase: base.Base | null;
  public constructor(
    name: string,
    id: string,
    position: Vec2,
    radius: number,
    colour: string,
    surfaceBase: base.Base | null = null,
  ) {
    super(name, id, position, radius, colour);
    this.surfaceBase = surfaceBase;
  }

  public override serialize(id: string | null): PackedMinorBody {
    return {
      ...super.serialize(id),
      surfaceBase:
        this.surfaceBase === null ? null : this.surfaceBase.serialize(id),
    };
  }
}
export interface PackedMinorBody extends PackedCelestialBody {
  surfaceBase: base.PackedBase | null;
}

export enum ResourceType {
  UNKNOWN,
  ORE,
  ICE,
  NONE,
}
export class AsteroidCluster {
  public static BELT_DENSITY = 0.15;
  public static BELT_OUTER_RADIUS = 30;
  public static BELT_INNER_RADIUS = 19;
  public static BELT_BODY_STANDOFF = 5;

  public id: string;

  public position: Vec2;

  public resource: ResourceType;
  public prospected: string[];

  public outpost: base.Outpost | null;

  public constructor(
    id: string,
    position: Vec2,
    resource: ResourceType,
    prospected: string[] = [],
    outpost: base.Outpost | null = null,
  ) {
    this.id = id;

    this.position = position;

    this.resource = resource;
    this.prospected = prospected;

    this.outpost = outpost;
  }

  public serialize(id: string | null): PackedAsteroidCluster {
    if (id === null) {
      return {
        id: this.id,
        position: this.position.serialize(),
        resource: this.resource,
        prospected: this.prospected,
        outpost: this.outpost === null ? null : this.outpost.serialize(id),
      };
    } else {
      return {
        id: this.id,
        position: this.position.serialize(),
        resource: this.prospected.includes(id)
          ? this.resource
          : ResourceType.UNKNOWN,
        prospected: this.prospected.includes(id) ? [id] : [],
        outpost: this.outpost === null ? null : this.outpost.serialize(id),
      };
    }
  }
  public static deserialize(data: unknown): AsteroidCluster {
    if (typeof data !== "object")
      throw new UnpackError("asteroid cluster must be an object");
    if (data === null)
      throw new UnpackError("asteroid cluster must not be null");

    if (!typing.hasOwnProperty(data, "id"))
      throw new UnpackError("asteroid cluster must have 'id' property");
    if (!(typeof data.id === "string"))
      throw new UnpackError("asteroid cluster id must be a string");

    if (!typing.hasOwnProperty(data, "position"))
      throw new UnpackError("asteroid cluster must have 'position' property");

    if (!typing.hasOwnProperty(data, "resource"))
      throw new UnpackError("asteroid cluster must have 'resource' property");
    if (
      !(
        data.resource === ResourceType.UNKNOWN ||
        data.resource === ResourceType.ORE ||
        data.resource === ResourceType.ICE ||
        data.resource === ResourceType.NONE
      )
    )
      throw new UnpackError("asteroid cluster resource must be a ResourceType");

    if (!typing.hasOwnProperty(data, "prospected"))
      throw new UnpackError("asteroid cluster must have 'prospected' property");
    if (
      !(
        Array.isArray(data.prospected) &&
        data.prospected.every((value, _index, _array) => {
          return typeof value === "string";
        })
      )
    )
      throw new UnpackError(
        "asteroic cluster prospected must be an array of strings",
      );

    if (!typing.hasOwnProperty(data, "outpost"))
      throw new UnpackError("asteroid cluster must have 'outpost' property");

    return new AsteroidCluster(
      data.id,
      Vec2.deserialize(data.position),
      data.resource,
      data.prospected,
      data.outpost === null ? null : base.Outpost.deserialize(data.outpost),
    );
  }
}
export interface PackedAsteroidCluster {
  id: string;

  position: vec2.PackedVec2;

  resource: ResourceType;
  prospected: string[];

  outpost: base.PackedOutpost | null;
}
