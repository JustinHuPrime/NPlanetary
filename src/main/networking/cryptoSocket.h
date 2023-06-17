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

#ifndef NPLANETARY_NETWORKING_CRYPTOSOCKET_H_
#define NPLANETARY_NETWORKING_CRYPTOSOCKET_H_

#include <sodium.h>

#include <array>
#include <cstdint>
#include <iterator>
#include <list>
#include <memory>
#include <stop_token>
#include <string>
#include <vector>

#include "networking/rawSocket.h"

namespace nplanetary::networking {
class PasswordMismatchFlag {};

class CryptoServer;
class CryptoSocket {
  friend class CryptoServer;

 public:
  CryptoSocket(std::string const &hostname, std::string const &password,
               std::stop_token const &stopFlag);
  CryptoSocket(CryptoSocket const &) noexcept = delete;
  CryptoSocket(CryptoSocket &&) noexcept = default;

  ~CryptoSocket() noexcept = default;

  CryptoSocket &operator=(CryptoSocket const &) noexcept = delete;
  CryptoSocket &operator=(CryptoSocket &&) noexcept = default;

  void read(uint8_t *, size_t n);
  void write(uint8_t const *, size_t n);
  void flush();

 private:
  CryptoSocket(RawSocket rawSocket, std::string const &password);

  void pull();

  static constexpr uint16_t BUFFER_LIMIT = 4096;
  static constexpr size_t VERIFICATION_PACKET_SIZE = 32;

  RawSocket rawSocket;

  crypto_secretstream_xchacha20poly1305_state sendState;
  crypto_secretstream_xchacha20poly1305_state recvState;

  /** list of chunks of decrypted data received */
  std::list<std::vector<uint8_t>> recvBuffer;
  /** vector of data to be encrypted and sent */
  std::vector<uint8_t> sendBuffer;
};

class CryptoServer {
 public:
  CryptoServer(std::string const &password, std::stop_token const &stopFlag);
  CryptoServer(CryptoServer const &) noexcept = delete;
  CryptoServer(CryptoServer &&) noexcept = default;

  ~CryptoServer() noexcept = default;

  CryptoServer &operator=(CryptoServer const &) noexcept = delete;
  CryptoServer &operator=(CryptoServer &&) noexcept = default;

  CryptoSocket accept();

 private:
  RawServer rawServer;

  std::string password;
};
}  // namespace nplanetary::networking

#endif  // NPLANETARY_NETWORKING_CRYPTOSOCKET_H_
