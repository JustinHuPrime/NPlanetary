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

interface Props {
  state: game.Game;
}

interface State {
  offsetX: number;
  offsetY: number;
  scale: number;
}

let asteroidScatter: Array<Array<{ offset: Vec2; radius: number }>> = [];

const HEX_SCALE = 30;
const HEX_WIDTH = (Math.sqrt(3) * HEX_SCALE) / 2;
const HEX_HEIGHT = HEX_SCALE;

const BASE_WIDTH = 0.2;

export default class Renderer extends React.Component<Props, State> {
  private canvas: React.RefObject<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private mouseDragStart: { x: number; y: number } | undefined;

  constructor(props: Props) {
    super(props);

    this.canvas = React.createRef();

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleWheel = this.handleWheel.bind(this);

    this.state = {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    };
  }

  public override componentDidMount() {
    // TODO: add window resize handling
    // window.addEventListener("resize", () => this.draw());

    this.ctx = this.canvas.current!.getContext("2d")!;
    requestAnimationFrame((_) => this.draw());
  }

  public override componentDidUpdate() {
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

    this.setState({
      offsetX: this.state.offsetX + ev.screenX - this.mouseDragStart.x,
      offsetY: this.state.offsetY + ev.screenY - this.mouseDragStart.y,
    });
    this.mouseDragStart = {
      x: ev.screenX,
      y: ev.screenY,
    };
  }

  public handleMouseUp(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if ((ev.buttons & 2) === 0) {
      return;
    }

    if (!this.mouseDragStart) {
      return;
    }

    this.setState({
      offsetX: this.state.offsetX + ev.screenX - this.mouseDragStart.x,
      offsetY: this.state.offsetY + ev.screenY - this.mouseDragStart.y,
    });
    this.mouseDragStart = undefined;
  }

  public handleMouseLeave(ev: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if ((ev.buttons & 2) === 0) {
      return;
    }

    if (!this.mouseDragStart) {
      return;
    }

    this.setState({
      offsetX: this.state.offsetX + ev.screenX - this.mouseDragStart.x,
      offsetY: this.state.offsetY + ev.screenY - this.mouseDragStart.y,
    });
    this.mouseDragStart = undefined;
  }

  public handleWheel(ev: React.WheelEvent<HTMLCanvasElement>) {
    if (ev.deltaY > 0 && this.state.scale > 0.5) {
      this.setState({
        offsetX:
          (this.state.offsetX -
            ev.screenX +
            this.canvas.current!.clientWidth / 2) /
            1.125 +
          ev.screenX -
          this.canvas.current!.clientWidth / 2,
        offsetY:
          (this.state.offsetY -
            ev.screenY +
            this.canvas.current!.clientHeight / 2) /
            1.125 +
          ev.screenY -
          this.canvas.current!.clientHeight / 2,
        scale: this.state.scale / 1.125,
      });
    } else if (ev.deltaY < 0 && this.state.scale < 2) {
      this.setState({
        offsetX:
          (this.state.offsetX -
            ev.screenX +
            this.canvas.current!.clientWidth / 2) *
            1.125 +
          ev.screenX -
          this.canvas.current!.clientWidth / 2,
        offsetY:
          (this.state.offsetY -
            ev.screenY +
            this.canvas.current!.clientHeight / 2) *
            1.125 +
          ev.screenY -
          this.canvas.current!.clientHeight / 2,
        scale: this.state.scale * 1.125,
      });
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
      this.canvas.current!.width / 2 + this.state.offsetX,
      this.canvas.current!.height / 2 + this.state.offsetY,
    );
    this.ctx.scale(this.state.scale, this.state.scale);

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
    });

    // layer 3: render velocity arrows

    // layer 4: render entities
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
