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

#include "networking/networking.h"

#include <catch2/catch_test_macros.hpp>
#include <thread>

using namespace std;
using namespace nplanetary::networking;

TEST_CASE("Can construct server socket", "[networking]") {
  stop_source source;
  Server("password", source.get_token());
}

TEST_CASE("Can construct client socket and connect to server", "[networking]") {
  stop_source source;
  Server server = Server("password", source.get_token());
  thread client = thread(
      [](stop_token stopFlag) { Socket("127.0.0.1", "password", stopFlag); },
      source.get_token());
  server.accept();
  client.join();
}

TEST_CASE("Can connect to server and send data", "[networking]") {
  stop_source source;
  Server server = Server("password", source.get_token());

  uint8_t message = 0xdb;
  thread sender = thread(
      [&message](stop_token stopFlag) {
        Socket socket = Socket("127.0.0.1", "password", stopFlag);
        socket << message;
        socket.flush();
      },
      source.get_token());
  Socket connection = server.accept();
  uint8_t recvd;
  connection >> recvd;
  REQUIRE(message == recvd);
  sender.join();
}

TEST_CASE("Can connect to server and receive data", "[networking]") {
  stop_source source;
  Server server = Server("password", source.get_token());

  uint8_t message = 0xdb;
  thread sender = thread(
      [&message](stop_token stopFlag) {
        Socket socket = Socket("127.0.0.1", "password", stopFlag);
        uint8_t recvd;
        socket >> recvd;
        REQUIRE(message == recvd);
      },
      source.get_token());
  Socket connection = server.accept();
  connection << message;
  connection.flush();
  sender.join();
}

TEST_CASE("Invalid password raises exception in networking", "[networking]") {
  stop_source source;
  Server server = Server("password", source.get_token());
  thread client = thread(
      [](stop_token stopFlag) {
        try {
          Socket socket = Socket("127.0.0.1", "bad", stopFlag);
          FAIL("Expected password mismatch flag to be thrown");
        } catch (PasswordMismatchFlag const &) {
        }
      },
      source.get_token());
  try {
    Socket connection = server.accept();
    FAIL("Expected password mismatch flag to be thrown");
  } catch (PasswordMismatchFlag const &) {
  }
  client.join();
}
