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

import Renderer from "./renderer/renderer";
import Summary from "./tab/summary";

interface Props {
  setCurrentScene: (scene: JSX.Element) => void;
  id: string;
  state: game.Game;
}

interface State {
  state: game.Game;
  currentTab: JSX.Element;
}

export default class Game extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.setCurrentTab = this.setCurrentTab.bind(this);

    this.state = {
      state: this.props.state,
      currentTab: <Summary id={this.props.id} state={this.props.state} />,
    };
  }

  public setCurrentTab(currentTab: JSX.Element) {
    this.setState({ currentTab });
  }

  public override render(): JSX.Element {
    return (
      <div className="game-scene">
        <Renderer state={this.state.state} />
        <div className="tab-container">{this.state.currentTab}</div>
      </div>
    );
  }
}
