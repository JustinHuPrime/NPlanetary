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
  console.error("npm start -- new <filename> <numPlayers>");
  console.error("npm start -- load <filename>");
}

console.log("NPlanetary version 0.1.8");
console.log("Copyright 2023 Justin Hu");
console.log(
  "This is free software; see the source for copying conditions. There is NO",
);
console.log(
  "warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.",
);

if (process.argv.length < 3) {
  showUsage();
  process.exit(1);
}

switch (process.argv[2]) {
  case "new": {
    if (process.argv.length !== 5) {
      showUsage();
      process.exit(1);
    }

    const numPlayers = Number.parseFloat(process.argv[4] as string);
    if (!(Number.isInteger(numPlayers) && 2 <= numPlayers && numPlayers <= 6)) {
      console.error(
        `invalid number of players: expected between 2 and 6, got '${process.argv[4]}'`,
      );
      process.exit(1);
    }

    GameServer.newGame(process.argv[3] as string, numPlayers);
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
