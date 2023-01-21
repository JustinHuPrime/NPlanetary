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

import * as game from "../../../common/game/game";
import Vec2 from "../../../common/util/vec2";
import * as random from "../../../common/util/random";
import EntityMap from "../../util/entityMap";

interface Props {
  state: game.Game;
  entityMap: EntityMap;
  selectedEntity: string | null;
}

interface State {}

// note: this really must be a global; it must be consistent across different instances of a render component
let asteroidScatter: Array<
  Array<{ offset: { x: number; y: number }; radius: number }>
> = [];

const HEX_SCALE = 30;
const HEX_WIDTH = (Math.sqrt(3) * HEX_SCALE) / 2;
const HEX_HEIGHT = HEX_SCALE;

const BASE_WIDTH = 0.2;

const GRAV_ARROW_BACK = 0;
const GRAV_ARROW_FORWARD = 0.3;
const GRAV_ARROW_WIDTH = 0.2;
const GRAV_ARROW_HEAD_WIDTH = 0.4;
const GRAV_ARROW_HEAD_FORWARD = 0.6;

const SQRT_VELOCITY_ARROW_HEAD_LENGTH = 0.3;

const ENTITY_SIZE = 0.6;

export default class Renderer extends React.Component<Props, State> {
  private canvas: React.RefObject<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private mouseDragStart: { x: number; y: number } | undefined;
  private transform: {
    offsetX: number;
    offsetY: number;
    scale: number;
  };

  constructor(props: Props) {
    super(props);

    this.canvas = React.createRef();

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.draw = this.draw.bind(this);

    this.transform = {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    };

    this.state = {};
  }

  public override componentDidMount() {
    // TODO: add window resize handling
    // window.addEventListener("resize", () => this.draw());

    this.ctx = this.canvas.current!.getContext("2d")!;
    requestAnimationFrame((_) => this.draw());
  }

  public handleMouseDown(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if ((ev.buttons & 2) === 0) {
      return;
    }

    this.mouseDragStart = {
      x: ev.screenX,
      y: ev.screenY,
    };
  }

  public handleMouseMove(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if ((ev.buttons & 2) === 0) {
      return;
    }

    if (!this.mouseDragStart) {
      return;
    }

    this.transform.offsetX += ev.screenX - this.mouseDragStart.x;
    this.transform.offsetY += ev.screenY - this.mouseDragStart.y;
    this.mouseDragStart = {
      x: ev.screenX,
      y: ev.screenY,
    };
    requestAnimationFrame((_) => this.draw());
  }

  public handleMouseUp(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if ((ev.buttons & 2) === 0) {
      return;
    }

    if (!this.mouseDragStart) {
      return;
    }

    this.transform.offsetX += ev.screenX - this.mouseDragStart.x;
    this.transform.offsetY += ev.screenY - this.mouseDragStart.y;
    this.mouseDragStart = undefined;
  }

  public handleMouseLeave(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if ((ev.buttons & 2) === 0) {
      return;
    }

    if (!this.mouseDragStart) {
      return;
    }

    this.transform.offsetX += ev.screenX - this.mouseDragStart.x;
    this.transform.offsetY += ev.screenY - this.mouseDragStart.y;
    this.mouseDragStart = undefined;
  }

  public handleWheel(ev: React.WheelEvent<HTMLCanvasElement>) {
    if (ev.deltaY > 0 && this.transform.scale > 0.5) {
      this.transform.offsetX =
        (this.transform.offsetX -
          ev.screenX +
          this.canvas.current!.clientWidth / 2) /
          1.125 +
        ev.screenX -
        this.canvas.current!.clientWidth / 2;
      this.transform.offsetY =
        (this.transform.offsetY -
          ev.screenY +
          this.canvas.current!.clientHeight / 2) /
          1.125 +
        ev.screenY -
        this.canvas.current!.clientHeight / 2;
      this.transform.scale /= 1.125;
      requestAnimationFrame((_) => this.draw());
    } else if (ev.deltaY < 0 && this.transform.scale < 2) {
      this.transform.offsetX =
        (this.transform.offsetX -
          ev.screenX +
          this.canvas.current!.clientWidth / 2) *
          1.125 +
        ev.screenX -
        this.canvas.current!.clientWidth / 2;
      this.transform.offsetY =
        (this.transform.offsetY -
          ev.screenY +
          this.canvas.current!.clientHeight / 2) *
          1.125 +
        ev.screenY -
        this.canvas.current!.clientHeight / 2;
      this.transform.scale *= 1.125;
      requestAnimationFrame((_) => this.draw());
    }
  }

  private draw() {
    // reset transform
    this.canvas.current!.width = this.canvas.current!.clientWidth;
    this.canvas.current!.height = this.canvas.current!.clientHeight;
    this.ctx.resetTransform();

    // clear canvas
    this.ctx.clearRect(
      0,
      0,
      this.canvas.current!.width,
      this.canvas.current!.height,
    );

    // set transform
    this.ctx.translate(
      this.canvas.current!.width / 2 + this.transform.offsetX,
      this.canvas.current!.height / 2 + this.transform.offsetY,
    );
    this.ctx.scale(this.transform.scale, this.transform.scale);

    // layer 1: render grid
    this.ctx.strokeStyle = "#000000";
    this.ctx.lineWidth = 1;
    for (let q = -game.Game.MAP_LIMIT; q <= game.Game.MAP_LIMIT; ++q) {
      for (
        let r = Math.max(-game.Game.MAP_LIMIT, -q - game.Game.MAP_LIMIT);
        r <= Math.min(game.Game.MAP_LIMIT, -q + game.Game.MAP_LIMIT);
        ++r
      ) {
        const center = Vec2.toScreen(q, r, HEX_SCALE);
        this.ctx.beginPath();
        this.ctx.moveTo(center.x, center.y - HEX_HEIGHT);
        this.ctx.lineTo(center.x - HEX_WIDTH, center.y - HEX_HEIGHT / 2);
        this.ctx.lineTo(center.x - HEX_WIDTH, center.y + HEX_HEIGHT / 2);
        this.ctx.lineTo(center.x, center.y + HEX_HEIGHT);
        this.ctx.lineTo(center.x + HEX_WIDTH, center.y + HEX_HEIGHT / 2);
        this.ctx.lineTo(center.x + HEX_WIDTH, center.y - HEX_HEIGHT / 2);
        this.ctx.closePath();
        this.ctx.stroke();
      }
    }

    // layer 2: render celstials, gravity, and celestial body bases

    // celestial bodies
    this.props.state.celestials.forEach((celestial, _index, _array) => {
      const center = celestial.position.toScreen(HEX_SCALE);
      this.ctx.fillStyle = celestial.colour;
      this.ctx.beginPath();
      this.ctx.arc(
        center.x,
        center.y,
        celestial.radius * HEX_SCALE,
        0,
        2 * Math.PI,
      );
      this.ctx.fill();

      // planetary bases
      if (celestial instanceof game.LandableBody) {
        celestial.surfaceBases.forEach((base, index, _array) => {
          if (base === null) return;

          this.ctx.beginPath();
          this.ctx.fillStyle =
            game.Game.PLAYER_COLOURS[
              this.props.state.playerIds.indexOf(base.owner)
            ]!;
          this.ctx.strokeStyle = "#000000";
          this.ctx.lineWidth = 1;
          this.ctx.arc(
            center.x,
            center.y,
            (BASE_WIDTH + celestial.radius) * HEX_SCALE,
            index * (Math.PI / 3),
            (index + 1) * (Math.PI / 3),
            false,
          );
          this.ctx.arc(
            center.x,
            center.y,
            celestial.radius * HEX_SCALE,
            (index + 1) * (Math.PI / 3),
            index * (Math.PI / 3),
            true,
          );
          this.ctx.fill();
          this.ctx.stroke();
        });
      }

      // gravity
      if (!(celestial instanceof game.MinorBody)) {
        celestial.position.adjacent().forEach((pos, _index, _array) => {
          const grav = pos.toScreen(HEX_SCALE);
          const theta = Math.atan2(center.y - grav.y, center.x - grav.x);

          this.ctx.beginPath();
          this.ctx.fillStyle = "#000000";
          this.ctx.moveTo(
            grav.x +
              HEX_SCALE *
                (Math.cos(theta) * GRAV_ARROW_BACK -
                  Math.sin(theta) * GRAV_ARROW_WIDTH),
            grav.y +
              HEX_SCALE *
                (Math.sin(theta) * GRAV_ARROW_BACK +
                  Math.cos(theta) * GRAV_ARROW_WIDTH),
          );
          this.ctx.lineTo(
            grav.x +
              HEX_SCALE *
                (Math.cos(theta) * GRAV_ARROW_BACK -
                  Math.sin(theta) * -GRAV_ARROW_WIDTH),
            grav.y +
              HEX_SCALE *
                (Math.sin(theta) * GRAV_ARROW_BACK +
                  Math.cos(theta) * -GRAV_ARROW_WIDTH),
          );
          this.ctx.lineTo(
            grav.x +
              HEX_SCALE *
                (Math.cos(theta) * GRAV_ARROW_FORWARD -
                  Math.sin(theta) * -GRAV_ARROW_WIDTH),
            grav.y +
              HEX_SCALE *
                (Math.sin(theta) * GRAV_ARROW_FORWARD +
                  Math.cos(theta) * -GRAV_ARROW_WIDTH),
          );
          this.ctx.lineTo(
            grav.x +
              HEX_SCALE *
                (Math.cos(theta) * GRAV_ARROW_FORWARD -
                  Math.sin(theta) * -GRAV_ARROW_HEAD_WIDTH),
            grav.y +
              HEX_SCALE *
                (Math.sin(theta) * GRAV_ARROW_FORWARD +
                  Math.cos(theta) * -GRAV_ARROW_HEAD_WIDTH),
          );
          this.ctx.lineTo(
            grav.x +
              HEX_SCALE *
                (Math.cos(theta) * GRAV_ARROW_HEAD_FORWARD -
                  Math.sin(theta) * 0),
            grav.y +
              HEX_SCALE *
                (Math.sin(theta) * GRAV_ARROW_HEAD_FORWARD +
                  Math.cos(theta) * 0),
          );
          this.ctx.lineTo(
            grav.x +
              HEX_SCALE *
                (Math.cos(theta) * GRAV_ARROW_FORWARD -
                  Math.sin(theta) * GRAV_ARROW_HEAD_WIDTH),
            grav.y +
              HEX_SCALE *
                (Math.sin(theta) * GRAV_ARROW_FORWARD +
                  Math.cos(theta) * GRAV_ARROW_HEAD_WIDTH),
          );
          this.ctx.lineTo(
            grav.x +
              HEX_SCALE *
                (Math.cos(theta) * GRAV_ARROW_FORWARD -
                  Math.sin(theta) * GRAV_ARROW_WIDTH),
            grav.y +
              HEX_SCALE *
                (Math.sin(theta) * GRAV_ARROW_FORWARD +
                  Math.cos(theta) * GRAV_ARROW_WIDTH),
          );
          this.ctx.closePath();
          this.ctx.fill();
        });
      }
    });

    this.props.state.asteroids.forEach((asteroid, index, _array) => {
      const pos = asteroid.position.toScreen(HEX_SCALE);
      if (!asteroidScatter[index]) {
        asteroidScatter[index] = [...new Array(100)].map(
          (_value, _index, _array) => {
            const radius = random.inRange(0, 0.05);
            const bound = 0.5 - radius;
            const q = random.inRange(-bound, bound);
            const r = random.inRange(
              Math.max(-bound, -q - bound),
              Math.min(bound, -q + bound),
            );
            return {
              offset: Vec2.toScreen(q, r, HEX_SCALE),
              radius: radius,
            };
          },
        );
      }

      asteroidScatter[index]!.forEach((scatter, _index, _array) => {
        this.ctx.beginPath();
        switch (asteroid.resource) {
          case game.ResourceType.UNKNOWN: {
            this.ctx.fillStyle = "#cc6600";
            break;
          }
          case game.ResourceType.ORE: {
            this.ctx.fillStyle = "#ffd700";
            break;
          }
          case game.ResourceType.ICE: {
            this.ctx.fillStyle = "#00d7ff";
            break;
          }
          case game.ResourceType.NONE: {
            this.ctx.fillStyle = "#000000";
            break;
          }
        }
        this.ctx.arc(
          pos.x + scatter.offset.x,
          pos.y + scatter.offset.y,
          scatter.radius * HEX_SCALE,
          0,
          Math.PI * 2,
        );
        this.ctx.fill();
      });
    });

    // layer 3: render velocity arrows
    this.props.state.ships.forEach((ship, _index, _array) => {
      this.renderVelocityArrow(
        ship,
        !this.props.selectedEntity || ship.id === this.props.selectedEntity,
      );
    });
    this.props.state.ordnance.forEach((ordnance, _index, _array) => {
      this.renderVelocityArrow(
        ordnance,
        !this.props.selectedEntity || ordnance.id === this.props.selectedEntity,
      );
    });

    // layer 4: render entities
  }

  private renderVelocityArrow(
    entity: { position: Vec2; velocity: Vec2 },
    highlight: boolean,
  ) {
    if (entity.velocity.q === 0 && entity.velocity.r === 0) return;

    const { x, y } = entity.position.toScreen(HEX_SCALE);
    const { x: dx, y: dy } = entity.velocity.toScreen(HEX_SCALE);
    const theta = Math.atan2(dy, dx);

    this.ctx.beginPath();
    this.ctx.strokeStyle = highlight ? "#000000" : "#808080";
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + dx, y + dy);

    this.ctx.moveTo(
      x +
        dx +
        HEX_SCALE *
          (Math.cos(theta) * -SQRT_VELOCITY_ARROW_HEAD_LENGTH -
            Math.sin(theta) * SQRT_VELOCITY_ARROW_HEAD_LENGTH),
      y +
        dy +
        HEX_SCALE *
          (Math.sin(theta) * -SQRT_VELOCITY_ARROW_HEAD_LENGTH +
            Math.cos(theta) * SQRT_VELOCITY_ARROW_HEAD_LENGTH),
    );
    this.ctx.lineTo(x + dx, y + dy);

    this.ctx.moveTo(
      x +
        dx +
        HEX_SCALE *
          (Math.cos(theta) * -SQRT_VELOCITY_ARROW_HEAD_LENGTH -
            Math.sin(theta) * -SQRT_VELOCITY_ARROW_HEAD_LENGTH),
      y +
        dy +
        HEX_SCALE *
          (Math.sin(theta) * -SQRT_VELOCITY_ARROW_HEAD_LENGTH +
            Math.cos(theta) * -SQRT_VELOCITY_ARROW_HEAD_LENGTH),
    );
    this.ctx.lineTo(x + dx, y + dy);
    this.ctx.stroke();
  }

  public override render(): JSX.Element {
    return (
      <canvas
        ref={this.canvas}
        className="game-canvas"
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
        onMouseLeave={this.handleMouseLeave}
        onWheel={this.handleWheel}
      ></canvas>
    );
  }
}
