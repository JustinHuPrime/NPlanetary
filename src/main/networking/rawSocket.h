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

#ifndef NPLANETARY_NETWORKING_RAWSOCKET_H_
#define NPLANETARY_NETWORKING_RAWSOCKET_H_

#if defined(__linux__)
#else
#error "OS not recognized/supported"
#endif

#include <stop_token>
#include <string>

namespace nplanetary::networking {
constexpr uint16_t PORT = 0x4e50;

class HangupFlag {};

class RawServer;
class RawSocket {
  friend class RawServer;

 public:
  /**
   * Create a socket connecting to some host
   */
  explicit RawSocket(std::string const &hostname, std::stop_token stopFlag);
  RawSocket(RawSocket const &) noexcept = delete;
  RawSocket(RawSocket &&) noexcept;

  ~RawSocket() noexcept;

  RawSocket &operator=(RawSocket const &) noexcept = delete;
  RawSocket &operator=(RawSocket &&) noexcept;

  /**
   * Reads count bytes into buf
   */
  void read(uint8_t *buf, size_t count);
  /**
   * Writes count bytes from buf
   */
  void write(uint8_t const *buf, size_t count);

 private:
#if defined(__linux__)
  explicit RawSocket(int fd, std::stop_token stopFlag) noexcept;

  int fd;
  std::stop_token stopFlag;
#endif
};

class RawServer {
 public:
  /**
   * Create a server socket
   */
  explicit RawServer(std::stop_token stopFlag);
  RawServer(RawServer const &) noexcept = delete;
  RawServer(RawServer &&) noexcept;

  ~RawServer() noexcept;

  RawServer &operator=(RawServer const &) noexcept = delete;
  RawServer &operator=(RawServer &&) noexcept;

  /**
   * Accepts a connection
   */
  RawSocket accept();

 private:
#if defined(__linux__)
  static constexpr int QUEUE_LENGTH = 4;

  int fd;
  std::stop_token stopFlag;
#endif
};
}  // namespace nplanetary::networking

#endif  // NPLANETARY_NETWORKING_RAWSOCKET_H_
