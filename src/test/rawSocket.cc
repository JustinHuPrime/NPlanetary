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

#include "networking/rawSocket.h"

#include <array>
#include <catch2/catch_test_macros.hpp>
#include <condition_variable>
#include <thread>

using namespace std;
using namespace nplanetary::networking;

TEST_CASE("Can construct server socket", "[networking]") {
  stop_source source;
  REQUIRE_NOTHROW(RawServer(source.get_token()));
}

TEST_CASE("Can construct client socket and connect to server", "[networking]") {
  stop_source source;
  RawServer server = RawServer(source.get_token());
  REQUIRE_NOTHROW(RawSocket("127.0.0.1", source.get_token()));
}

TEST_CASE("Can connect to server and send data", "[networking]") {
  stop_source source;
  RawServer server = RawServer(source.get_token());

  array<uint8_t, 16> message = {
      0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
  };
  jthread sender = jthread([&message](stop_token stopFlag) {
    RawSocket socket("127.0.0.1", stopFlag);
    socket.write(message.data(), message.size());
  });
  RawSocket connection = server.accept();
  array<uint8_t, 16> recvd;
  connection.read(recvd.data(), recvd.size());
  REQUIRE(message == recvd);
}

TEST_CASE("Can connect to server and receive data", "[networking]") {
  stop_source source;
  RawServer server = RawServer(source.get_token());

  array<uint8_t, 16> message = {
      0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7,
  };
  jthread sender = jthread([&message](stop_token stopFlag) {
    RawSocket socket("127.0.0.1", stopFlag);
    array<uint8_t, 16> recvd;
    socket.read(recvd.data(), recvd.size());
    REQUIRE(message == recvd);
  });
  RawSocket connection = server.accept();
  connection.write(message.data(), message.size());
}