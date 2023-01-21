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

interface Props {
  id: string;
  state: game.Game;
}

interface State {}

export default class Summary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  public override render(): JSX.Element {
    return (
      <div className="tab">
        <h1>Summary Tab</h1>
      </div>
    ); // TODO
  }
}