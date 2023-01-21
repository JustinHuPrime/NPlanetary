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
import * as debug from "../../common/util/debug";
import UnpackError from "../../common/util/unpackError";
import * as websocket from "../util/websocket";
import ConnectionLost from "./connectionLost";
import Game from "./game";

interface Props {
  setCurrentScene: (scene: JSX.Element) => void;
  id: string;
}

interface State {}

export default class Waiting extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    debug.log(`accepted with id ${this.props.id}`);
  }

  public override async componentDidMount(): Promise<void> {
    let packet: string;
    try {
      packet = await websocket.recv();
    } catch (e) {
      if (e instanceof websocket.ConnectionError) {
        return this.props.setCurrentScene(
          <ConnectionLost setCurrentScene={this.props.setCurrentScene} />,
        );
      } else {
        throw e;
      }
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(packet);
    } catch (e) {
      websocket.protocolError("malformed packet (could not parse content)");
      return this.props.setCurrentScene(
        <ConnectionLost setCurrentScene={this.props.setCurrentScene} />,
      );
    }

    let state: game.Game;
    try {
      state = game.Game.deserialize(parsed);
    } catch (e) {
      if (e instanceof UnpackError) {
        websocket.protocolError("malformed packet (invalid content)");
        return this.props.setCurrentScene(
          <ConnectionLost setCurrentScene={this.props.setCurrentScene} />,
        );
      } else {
        throw e;
      }
    }

    return this.props.setCurrentScene(
      <Game
        setCurrentScene={this.props.setCurrentScene}
        id={this.props.id}
        state={state}
      />,
    );
  }

  public override render(): JSX.Element {
    return (
      <div className="scene">
        <h1>Waiting for players...</h1>
      </div>
    );
  }
}
