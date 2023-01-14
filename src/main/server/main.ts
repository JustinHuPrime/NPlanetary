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

import GameServer from "./server";

function showUsage(): void {
  console.error("usage:");
  console.error("npm start -- new <filename>");
  console.error("npm start -- load <filename>");
}

if (process.argv.length < 3) {
  showUsage();
  process.exit(1);
}

switch (process.argv[2]) {
  case "new": {
    if (process.argv.length !== 4) {
      showUsage();
      process.exit(1);
    }

    GameServer.newGame(process.argv[3] as string);
    break;
  }
  case "load": {
    if (process.argv.length !== 4) {
      showUsage();
      process.exit(1);
    }

    GameServer.loadGame(process.argv[3] as string);
    break;
  }
  default: {
    showUsage();
    process.exit(1);
  }
}
