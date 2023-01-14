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

import * as restify from "restify";
import WebSocket from "ws";
import * as fs from "fs";
import * as random from "../common/util/random";

export default class GameServer {
  private filename: string;

  private httpServer: restify.Server;
  private wsServer: WebSocket.Server;
  private joinCode: string;

  constructor(filename: string) {
    this.filename = filename;
    this.joinCode = [...new Array(20)]
      .map((_value, _index, _array) => {
        return Math.floor(random.inRange(0, 36)).toString(36);
      })
      .join("");

    let certificate: Buffer;
    let key: Buffer;
    try {
      certificate = fs.readFileSync("cert.pem");
    } catch (e) {
      console.error(
        "could not read file 'cert.pem' - ensure a TLS certificate/key pair exists",
      );
      process.exit(1);
    }
    try {
      key = fs.readFileSync("key.pem");
    } catch (e) {
      console.error(
        "could not read file 'key.pem' - ensure a TLS certificate/key pair exists",
      );
      process.exit(1);
    }

    this.httpServer = restify.createServer({
      certificate,
      key,
    });
    this.httpServer.pre((req, _res, next) => {
      if (
        req.url !== undefined &&
        req.url.startsWith("/scripts/") &&
        !req.url.includes(".")
      )
        req.url += ".js";
      return next();
    });
    this.httpServer.get(
      "/*",
      restify.plugins.serveStatic({
        directory: "public_html",
        default: "index.html",
      }),
    );

    this.wsServer = new WebSocket.Server({
      server: this.httpServer.server,
    });

    this.httpServer.listen(() => {
      console.log(
        `server started at ${this.httpServer.url} - join code is ${this.joinCode}`,
      );
    });
  }

  public static newGame(filename: string): GameServer {
    return new GameServer(filename);
  }
  public static loadGame(filename: string): GameServer {
    return new GameServer(filename);
  }
}
