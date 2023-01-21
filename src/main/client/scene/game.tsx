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
import EntityMap from "../util/entityMap";

interface Props {
  setCurrentScene: (scene: JSX.Element) => void;
  id: string;
  initialState: game.Game;
}

interface State {
  state: game.Game;
  currentTab: JSX.Element;
  selectedEntity: string | null;
}

export default class Game extends React.Component<Props, State> {
  private entityMap: EntityMap;

  constructor(props: Props) {
    super(props);

    this.setCurrentTab = this.setCurrentTab.bind(this);

    this.state = {
      state: this.props.initialState,
      currentTab: (
        <Summary id={this.props.id} state={this.props.initialState} />
      ),
      selectedEntity: null,
    };

    this.entityMap = new EntityMap(this.state.state);
  }

  public setCurrentTab(currentTab: JSX.Element) {
    this.setState({ currentTab });
  }

  public override componentDidUpdate(
    _: Readonly<Props>,
    prevState: Readonly<State>,
  ): void {
    if (prevState.state !== this.state.state)
      this.entityMap = new EntityMap(this.state.state);
  }

  public override render(): JSX.Element {
    return (
      <div className="game-scene">
        <Renderer
          state={this.state.state}
          entityMap={this.entityMap}
          selectedEntity={this.state.selectedEntity}
        />
        <div className="tab-container">{this.state.currentTab}</div>
      </div>
    );
  }
}
