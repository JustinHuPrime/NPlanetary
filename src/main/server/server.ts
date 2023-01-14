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
import * as debug from "../common/util/debug";
import * as game from "../common/game/game";
import UnpackError from "../common/util/unpackError";
import id from "../common/util/idGenerator";

class PlayerConnection {
  public socket: WebSocket;
  public server: GameServer;
  public id: string;

  public constructor(
    socket: WebSocket,
    server: GameServer,
    id: string,
    username: string,
  ) {
    this.socket = socket;
    this.server = server;
    this.id = id;

    debug.log(`player ${username} (${this.id}) connected`);

    this.socket.on("message", (data, _isBinary) => {
      // TODO
    });
    this.socket.send(`a${this.id}`);

    this.socket.once("close", (_code, _reason) => {
      debug.log(`player ${username} (${this.id}) disconnected`);
      this.server.removePlayer(this);
    });
  }
}

export default class GameServer {
  private game: game.Game;

  private filename: string;

  private httpServer: restify.Server;
  private wsServer: WebSocket.Server;
  private joinCode: string;
  private connections: PlayerConnection[];

  constructor(game: game.Game, filename: string) {
    this.game = game;
    this.filename = filename;
    this.joinCode = [...new Array(20)]
      .map((_value, _index, _array) => {
        return Math.floor(random.inRange(0, 36)).toString(36);
      })
      .join("");
    this.connections = [];

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
    this.wsServer.on("connection", (socket, _request) => {
      debug.log("client connecting");
      socket.once("message", (data, _isBinary) => {
        const packet = data.toString();
        const matches = packet.match(/^([^\n]+)\n([^\n]+)$/);
        if (matches === null) {
          debug.log("rejected; bad packet format");
          socket.close(4002);
          return;
        }

        const username = matches[1] as string;
        const joinCode = matches[2] as string;

        if (joinCode !== this.joinCode) {
          // bad join code
          debug.log("rejected; joinCode incorrect");
          socket.send("b");
          socket.close(1008);
          return;
        }

        if (this.connections.length >= this.game.numPlayers) {
          // full, no hope of reconnect
          debug.log("rejected; game full with no hope of reconnecting");
          socket.send("f");
          socket.close(1008);
          return;
        }

        if (this.game.playerNames.includes(username)) {
          // reconnect attempt
          const id = this.game.playerIds[
            this.game.playerNames.indexOf(username)
          ] as string;
          debug.log(
            `found player id ${id} with username ${username} at index ${this.game.playerNames.indexOf(
              username,
            )}`,
          );

          if (
            this.connections.findIndex((connection, _index, _array) => {
              return connection.id === id;
            }) !== -1
          ) {
            // already connected
            debug.log("rejected; this username already connected");
            socket.send("f");
            socket.close(1008);
            return;
          }

          // reconnected
          const connection = new PlayerConnection(socket, this, id, username);
          this.connections.push(connection);
          if (this.game.isFull()) {
            // only send state if game has started
            connection.socket.send(
              JSON.stringify(this.game.serialize(connection.id)),
            );
          }
          debug.log("reconnected");
        } else {
          // new player
          if (this.game.isFull()) {
            // full, someone else could reconnect
            debug.log("rejected; game full but someone else could reconnect");
            socket.send("f");
            socket.close(1008);
            return;
          }

          // connected
          this.game.playerNames.push(username);
          const connection = new PlayerConnection(
            socket,
            this,
            this.game.playerIds[
              this.game.playerNames.indexOf(username)
            ] as string,
            username,
          );
          this.connections.push(connection);
          this.save();

          // maybe start game?
          if (this.game.isFull()) {
            debug.log("game full - starting");
            this.connections.forEach((connection, _index, _array) => {
              connection.socket.send(
                JSON.stringify(this.game.serialize(connection.id)),
              );
            });
          }
        }
      });
    });

    this.httpServer.listen(() => {
      console.log(
        `server started at ${this.httpServer.url} - join code is ${this.joinCode}`,
      );
    });
    this.save();
  }

  public removePlayer(player: PlayerConnection) {
    this.connections.splice(this.connections.indexOf(player), 1);
  }

  private save(): void {
    const serialized = JSON.stringify(this.game.serialize(null));
    try {
      fs.writeFileSync(`${this.filename}.temp`, serialized);
      fs.renameSync(`${this.filename}.temp`, this.filename);
    } catch (e) {
      console.error("ERROR: could not save game");
    }
  }

  public static newGame(filename: string, numPlayers: number): GameServer {
    return new GameServer(game.Game.setup(numPlayers), filename);
  }

  public static loadGame(filename: string): GameServer {
    let serialized;
    try {
      serialized = fs.readFileSync(filename, "utf8");
    } catch (e) {
      console.error(`ERROR: could not read save file ${filename}`);
      process.exit(1);
    }

    let parsed;
    try {
      parsed = JSON.parse(serialized);
    } catch (e) {
      console.error(`ERROR: could not parse save file ${filename}`);
      process.exit(1);
    }

    let deserialized;
    try {
      deserialized = game.Game.deserialize(parsed);
    } catch (e) {
      if (e instanceof UnpackError) {
        console.error(
          `ERROR: could not read save file ${filename}: ${e.message}`,
        );
        process.exit(1);
      } else {
        throw e;
      }
    }

    return new GameServer(deserialized, filename);
  }
}
