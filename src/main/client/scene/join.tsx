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

import * as websocket from "../util/websocket";
import ConnectionLost from "./connectionLost";
import Waiting from "./waiting";

interface Props {
  setCurrentScene: (scene: JSX.Element) => void;
}

interface State {
  username: string;
  password: string;
  connecting: boolean;
  errorMessage: string | null;
}

export default class Join extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);

    this.state = {
      username: "",
      password: "",
      connecting: false,
      errorMessage: null,
    };
  }

  public onChange(event: React.ChangeEvent<HTMLInputElement>) {
    switch (event.target.name) {
      case "username": {
        this.setState({
          username: event.target.value,
        });
        break;
      }
      case "password": {
        this.setState({
          password: event.target.value,
        });
      }
    }
  }

  public async onClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    try {
      this.setState({ connecting: true });

      await websocket.connect();

      websocket.send(`${this.state.username}\n${this.state.password}`);

      const response = await websocket.recv();
      switch (response) {
        case "b": {
          // bad code
          this.setState({ errorMessage: "Invalid join code" });
          break;
        }
        case "f": {
          // game full
          this.setState({ errorMessage: "Game is full" });
          break;
        }
        default: {
          const matches = response.match(/^a([0-9]+)$/);
          if (matches === null) {
            websocket.protocolError("invalid join response");
            return this.props.setCurrentScene(
              <ConnectionLost setCurrentScene={this.props.setCurrentScene} />,
            );
          } else {
            // connected
            return this.props.setCurrentScene(
              <Waiting
                id={matches[1] as string}
                setCurrentScene={this.props.setCurrentScene}
              />,
            );
          }
        }
      }
    } catch (e) {
      if (e instanceof websocket.ConnectionError) {
        return this.props.setCurrentScene(
          <ConnectionLost setCurrentScene={this.props.setCurrentScene} />,
        );
      } else {
        throw e;
      }
    } finally {
      this.setState({ connecting: false });
    }
  }

  public override render(): JSX.Element {
    return (
      <div className="scene">
        <h1>Join</h1>

        <label htmlFor="username">Username</label>
        <br />
        <input
          type="text"
          id="username"
          name="username"
          value={this.state.username}
          onChange={this.onChange}
          disabled={this.state.connecting}
        ></input>
        <br />

        <label htmlFor="password">Join Code</label>
        <br />
        <input
          type="password"
          id="password"
          name="password"
          value={this.state.password}
          onChange={this.onChange}
          disabled={this.state.connecting}
        ></input>
        <br />

        {this.state.errorMessage !== null && (
          <span className="red">{this.state.errorMessage}</span>
        )}

        <br />
        <button
          type="submit"
          onClick={this.onClick}
          disabled={this.state.connecting}
        >
          Join game!
        </button>
      </div>
    );
  }
}
