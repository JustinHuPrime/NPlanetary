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

#include "networking/cryptoSocket.h"

#include <sodium.h>

#include <catch2/catch_test_macros.hpp>
#include <thread>

using namespace std;
using namespace nplanetary::networking;

TEST_CASE("Sodium is automatically initialized", "[libraries]") {
  REQUIRE(sodium_init() == 1);
}

TEST_CASE("Can construct crypto server socket", "[networking]") {
  stop_source source;
  CryptoServer("password", source.get_token());
}

TEST_CASE("Can construct crypto client socket and connect to server",
          "[networking]") {
  stop_source source;
  CryptoServer server = CryptoServer("password", source.get_token());
  jthread client = jthread([](stop_token stopFlag) {
    try {
      CryptoSocket("127.0.0.1", "password", stopFlag);
    } catch (stop_token const &) {
    }
  });
  server.accept();
}

TEST_CASE("Can connect to crypto server and send data", "[networking]") {
  stop_source source;
  CryptoServer server = CryptoServer("password", source.get_token());

  array<uint8_t, 16> message = {
      0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
  };
  jthread sender = jthread([&message](stop_token stopFlag) {
    CryptoSocket socket = CryptoSocket("127.0.0.1", "password", stopFlag);
    socket.write(message.data(), message.size());
    socket.flush();
  });
  CryptoSocket connection = server.accept();
  array<uint8_t, 16> recvd;
  connection.read(recvd.data(), recvd.size());
  REQUIRE(message == recvd);
}

TEST_CASE("Can connect to crypto server and receive data", "[networking]") {
  stop_source source;
  CryptoServer server = CryptoServer("password", source.get_token());

  array<uint8_t, 16> message = {
      0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
  };
  thread sender = thread(
      [&message](stop_token stopFlag) {
        CryptoSocket socket = CryptoSocket("127.0.0.1", "password", stopFlag);
        array<uint8_t, 16> recvd;
        socket.read(recvd.data(), recvd.size());
        REQUIRE(message == recvd);
      },
      source.get_token());
  CryptoSocket connection = server.accept();
  connection.write(message.data(), message.size());
  connection.flush();
  sender.join();
}

TEST_CASE("Invalid password raises exception in crypto networking",
          "[networking][.disabled]") {
  stop_source source;
  CryptoServer server = CryptoServer("password", source.get_token());
  thread client = thread(
      [](stop_token stopFlag) {
        try {
          CryptoSocket socket = CryptoSocket("127.0.0.1", "bad", stopFlag);
          FAIL("Expected password mismatch flag to be thrown");
        } catch (PasswordMismatchFlag const &) {
        }
      },
      source.get_token());
  CryptoSocket connection = server.accept();
  client.join();
}
