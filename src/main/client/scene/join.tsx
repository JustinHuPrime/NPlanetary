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

interface Props {}

interface State {
  username: string;
  password: string;
}

export default class JoinScene extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      username: "",
      password: "",
    };

    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
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

  public onClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    alert(`Trying to join with ${this.state.username};${this.state.password}`);
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
        ></input>
        <br />

        <br />
        <button type="submit" onClick={this.onClick}>
          Join game!
        </button>
      </div>
    );
  }
}
