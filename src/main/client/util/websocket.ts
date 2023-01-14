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

let socket: WebSocket;
let queue: Array<string | ConnectionError>;
let awaiting: {
  resolve: (value: string) => void;
  reject: (reason: ConnectionError) => void;
} | null;

export class ConnectionError {}

export function connect(): Promise<void> {
  socket = new WebSocket(`wss://${window.location.host}`, "nplanetary");
  queue = [];
  awaiting = null;

  return new Promise((resolve, reject) => {
    const once = { once: true } as EventListenerOptions;
    const openHandler = (_ev: Event) => {
      socket.removeEventListener("error", errorHandler, once);
      socket.removeEventListener("close", closeHandler, once);

      socket.addEventListener("message", (ev) => {
        if (awaiting !== null) {
          const resolver = awaiting.resolve;
          awaiting = null;
          resolver(ev.data.toString());
        } else {
          queue.unshift(ev.data.toString());
        }
      });
      socket.addEventListener("error", (_ev) => {
        if (awaiting !== null) {
          const rejecter = awaiting.reject;
          awaiting = null;
          rejecter(new ConnectionError());
        } else {
          queue.unshift(new ConnectionError());
        }
      });
      socket.addEventListener("close", (_ev) => {
        if (awaiting !== null) {
          const rejecter = awaiting.reject;
          awaiting = null;
          rejecter(new ConnectionError());
        } else {
          queue.unshift(new ConnectionError());
        }
      });

      resolve();
    };
    const errorHandler = (_ev: Event) => {
      socket.removeEventListener("open", openHandler, once);
      socket.removeEventListener("close", closeHandler, once);
      reject(new ConnectionError());
    };
    const closeHandler = (_ev: Event) => {
      socket.removeEventListener("open", openHandler, once);
      socket.removeEventListener("error", errorHandler, once);
      reject(new ConnectionError());
    };

    socket.addEventListener("open", openHandler, once);
    socket.addEventListener("error", errorHandler, once);
    socket.addEventListener("close", closeHandler, once);
  });
}

export function send(data: string): void {
  socket.send(data);
}

export function recv(): Promise<string> {
  if (queue.length !== 0) {
    const recvd = queue.pop() as string | ConnectionError;
    if (typeof recvd === "string") {
      return Promise.resolve(recvd);
    } else {
      return Promise.reject(recvd);
    }
  } else {
    return new Promise((resolve, reject) => {
      awaiting = { resolve, reject };
    });
  }
}

export function protocolError(reason: string): void {
  socket.close(4002);
  alert(`Server violated protocol:\n${reason}`);
}
