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

#ifndef NPLANETARY_NETWORKING_NETWORKING_H_
#define NPLANETARY_NETWORKING_NETWORKING_H_

#include <cstdint>
#include <stop_token>
#include <string>

#include "networking/cryptoSocket.h"

namespace nplanetary::networking {
class Server;
class Socket {
  friend class Server;

 public:
  static constexpr uint8_t U8_TAG = 'b';
  static constexpr uint8_t U16_TAG = 's';
  static constexpr uint8_t U32_TAG = 'i';
  static constexpr uint8_t U64_TAG = 'l';
  static constexpr uint8_t S8_TAG = 'B';
  static constexpr uint8_t S16_TAG = 'S';
  static constexpr uint8_t S32_TAG = 'I';
  static constexpr uint8_t S64_TAG = 'L';
  static constexpr uint8_t CHAR_TAG = 'c';
  static constexpr uint8_t STRING_TAG = 'C';
  static constexpr uint8_t BOOL_TAG = 'o';

  Socket(std::string const &hostname, std::string const &password,
         std::stop_token const &stopFlag);
  Socket(Socket const &) noexcept = delete;
  Socket(Socket &&) noexcept = default;

  ~Socket() noexcept = default;

  Socket &operator=(Socket const &) noexcept = delete;
  Socket &operator=(Socket &&) noexcept = default;

  Socket &operator<<(uint8_t);
  Socket &operator<<(uint16_t);
  Socket &operator<<(uint32_t);
  Socket &operator<<(uint64_t);
  Socket &operator<<(int8_t);
  Socket &operator<<(int16_t);
  Socket &operator<<(int32_t);
  Socket &operator<<(int64_t);
  Socket &operator<<(char);
  Socket &operator<<(std::string const &);
  Socket &operator<<(bool);

  void flush();

  Socket &operator>>(uint8_t &);
  Socket &operator>>(uint16_t &);
  Socket &operator>>(uint32_t &);
  Socket &operator>>(uint64_t &);
  Socket &operator>>(int8_t &);
  Socket &operator>>(int16_t &);
  Socket &operator>>(int32_t &);
  Socket &operator>>(int64_t &);
  Socket &operator>>(char &);
  Socket &operator>>(std::string &);
  Socket &operator>>(bool &);

 private:
  explicit Socket(CryptoSocket cryptoSocket) noexcept;

  CryptoSocket cryptoSocket;
};

class Server {
 public:
  explicit Server(std::string const &password, std::stop_token const &stopFlag);
  Server(Server const &) noexcept = delete;
  Server(Server &&) noexcept = default;

  ~Server() noexcept = default;

  Server &operator=(Server const &) noexcept = delete;
  Server &operator=(Server &&) noexcept = default;

  Socket accept();

 private:
  CryptoServer cryptoServer;
};
}  // namespace nplanetary::networking

#endif  // NPLANETARY_NETWORKING_NETWORKING_H_
