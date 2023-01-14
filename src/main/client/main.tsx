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

import JoinScene from "./scene/join";

interface Props {}

interface State {
  currentScene: JSX.Element;
}

class SceneContainer extends React.Component<Props, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      currentScene: <JoinScene />,
    };

    this.setCurrentScene = this.setCurrentScene.bind(this);
  }

  public setCurrentScene(currentScene: JSX.Element) {
    this.setState({ currentScene });
  }

  public override render(): JSX.Element {
    return this.state.currentScene;
  }
}

ReactDOM.render(<SceneContainer />, document.getElementById("root"));
