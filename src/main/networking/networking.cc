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

#include <array>
#include <limits>
#include <utility>

using namespace std;

namespace nplanetary::networking {
namespace {
template <typename From, typename To>
To pun(From from) {
  static_assert(sizeof(From) == sizeof(To));

  union {
    To to;
    From from;
  } cvt = {.from = from};
  return cvt.to;
}
}  // namespace

Socket::Socket(string const &hostname, string const &password,
               stop_token const &stopFlag)
    : Socket(CryptoSocket(hostname, password, stopFlag)) {}

Socket &Socket::operator<<(uint8_t x) {
  array<uint8_t, sizeof(uint8_t) + 1> formatted;
  formatted[0] = U8_TAG;
  formatted[1] = (x >> 0) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  return *this;
}
Socket &Socket::operator<<(uint16_t x) {
  array<uint8_t, sizeof(uint16_t) + 1> formatted;
  formatted[0] = U16_TAG;
  formatted[1] = (x >> 0) & 0xff;
  formatted[2] = (x >> 8) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  return *this;
}
Socket &Socket::operator<<(uint32_t x) {
  array<uint8_t, sizeof(uint32_t) + 1> formatted;
  formatted[0] = U32_TAG;
  formatted[1] = (x >> 0) & 0xff;
  formatted[2] = (x >> 8) & 0xff;
  formatted[3] = (x >> 16) & 0xff;
  formatted[4] = (x >> 24) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  return *this;
}
Socket &Socket::operator<<(uint64_t x) {
  array<uint8_t, sizeof(uint32_t) + 1> formatted;
  formatted[0] = U64_TAG;
  formatted[1] = (x >> 0) & 0xff;
  formatted[2] = (x >> 8) & 0xff;
  formatted[3] = (x >> 16) & 0xff;
  formatted[4] = (x >> 24) & 0xff;
  formatted[5] = (x >> 32) & 0xff;
  formatted[6] = (x >> 40) & 0xff;
  formatted[7] = (x >> 48) & 0xff;
  formatted[8] = (x >> 56) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  return *this;
}
Socket &Socket::operator<<(int8_t x) {
  uint8_t u = pun<int8_t, uint8_t>(x);
  array<uint8_t, sizeof(uint8_t) + 1> formatted;
  formatted[0] = S8_TAG;
  formatted[1] = (u >> 0) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  return *this;
}
Socket &Socket::operator<<(int16_t x) {
  uint16_t u = pun<int16_t, uint16_t>(x);
  array<uint8_t, sizeof(uint16_t) + 1> formatted;
  formatted[0] = S16_TAG;
  formatted[1] = (u >> 0) & 0xff;
  formatted[2] = (u >> 8) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  return *this;
}
Socket &Socket::operator<<(int32_t x) {
  uint32_t u = pun<int32_t, uint32_t>(x);
  array<uint8_t, sizeof(uint32_t) + 1> formatted;
  formatted[0] = S32_TAG;
  formatted[1] = (u >> 0) & 0xff;
  formatted[2] = (u >> 8) & 0xff;
  formatted[3] = (u >> 16) & 0xff;
  formatted[4] = (u >> 24) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  return *this;
}
Socket &Socket::operator<<(int64_t x) {
  uint64_t u = pun<int64_t, uint64_t>(x);
  array<uint8_t, sizeof(uint32_t) + 1> formatted;
  formatted[0] = S64_TAG;
  formatted[1] = (u >> 0) & 0xff;
  formatted[2] = (u >> 8) & 0xff;
  formatted[3] = (u >> 16) & 0xff;
  formatted[4] = (u >> 24) & 0xff;
  formatted[5] = (u >> 32) & 0xff;
  formatted[6] = (u >> 40) & 0xff;
  formatted[7] = (u >> 48) & 0xff;
  formatted[8] = (u >> 56) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  return *this;
}
Socket &Socket::operator<<(string const &x) {
  if (x.size() > numeric_limits<uint16_t>::max()) {
    throw runtime_error("string too long to send");
  }

  array<uint8_t, sizeof(uint16_t) + 1> formatted;
  formatted[0] = STRING_TAG;
  formatted[1] = (x.size() >> 0) & 0xff;
  formatted[2] = (x.size() >> 8) & 0xff;

  cryptoSocket.write(formatted.data(), formatted.size());
  cryptoSocket.write(reinterpret_cast<uint8_t const *>(x.c_str()), x.size());
  return *this;
}

void Socket::flush() { return cryptoSocket.flush(); }

Socket &Socket::operator>>(uint8_t &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != U8_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint8_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  x = (static_cast<uint8_t>(bytes[0]) << 0);

  return *this;
}
Socket &Socket::operator>>(uint16_t &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != U16_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint16_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  x = (static_cast<uint16_t>(bytes[0]) << 0) |
      (static_cast<uint16_t>(bytes[1]) << 8);

  return *this;
}
Socket &Socket::operator>>(uint32_t &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != U32_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint32_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  x = (static_cast<uint32_t>(bytes[0]) << 0) |
      (static_cast<uint32_t>(bytes[1]) << 8) |
      (static_cast<uint32_t>(bytes[2]) << 16) |
      (static_cast<uint32_t>(bytes[3]) << 24);

  return *this;
}
Socket &Socket::operator>>(uint64_t &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != U64_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint64_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  x = (static_cast<uint64_t>(bytes[0]) << 0) |
      (static_cast<uint64_t>(bytes[1]) << 8) |
      (static_cast<uint64_t>(bytes[2]) << 16) |
      (static_cast<uint64_t>(bytes[3]) << 24) |
      (static_cast<uint64_t>(bytes[4]) << 32) |
      (static_cast<uint64_t>(bytes[5]) << 40) |
      (static_cast<uint64_t>(bytes[6]) << 48) |
      (static_cast<uint64_t>(bytes[7]) << 56);

  return *this;
}
Socket &Socket::operator>>(int8_t &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != S8_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint8_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  uint8_t u = (static_cast<uint8_t>(bytes[0]) << 0);
  x = pun<uint8_t, int8_t>(u);

  return *this;
}
Socket &Socket::operator>>(int16_t &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != S16_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint16_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  uint16_t u = (static_cast<uint16_t>(bytes[0]) << 0) |
               (static_cast<uint16_t>(bytes[1]) << 8);
  x = pun<uint16_t, int16_t>(u);

  return *this;
}
Socket &Socket::operator>>(int32_t &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != S32_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint32_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  uint32_t u = (static_cast<uint32_t>(bytes[0]) << 0) |
               (static_cast<uint32_t>(bytes[1]) << 8) |
               (static_cast<uint32_t>(bytes[2]) << 16) |
               (static_cast<uint32_t>(bytes[3]) << 24);
  x = pun<uint32_t, int32_t>(u);

  return *this;
}
Socket &Socket::operator>>(int64_t &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != U64_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint64_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  uint64_t u = (static_cast<uint64_t>(bytes[0]) << 0) |
               (static_cast<uint64_t>(bytes[1]) << 8) |
               (static_cast<uint64_t>(bytes[2]) << 16) |
               (static_cast<uint64_t>(bytes[3]) << 24) |
               (static_cast<uint64_t>(bytes[4]) << 32) |
               (static_cast<uint64_t>(bytes[5]) << 40) |
               (static_cast<uint64_t>(bytes[6]) << 48) |
               (static_cast<uint64_t>(bytes[7]) << 56);
  x = pun<uint32_t, int32_t>(u);

  return *this;
}
Socket &Socket::operator>>(string &x) {
  uint8_t tag;
  cryptoSocket.read(&tag, 1);

  if (tag != STRING_TAG) {
    throw runtime_error("type tag mismatch");
  }

  array<uint8_t, sizeof(uint16_t)> bytes;
  cryptoSocket.read(bytes.data(), bytes.size());

  uint16_t size = (static_cast<uint16_t>(bytes[0]) << 0) |
                  (static_cast<uint16_t>(bytes[1]) << 8);

  x.resize(size);
  cryptoSocket.read(reinterpret_cast<uint8_t *>(x.data()), size);
  return *this;
}

Socket::Socket(CryptoSocket cryptoSocket) noexcept
    : cryptoSocket(move(cryptoSocket)) {}

Server::Server(string const &password, stop_token const &stopFlag)
    : cryptoServer(password, stopFlag) {}

Socket Server::accept() { return Socket(cryptoServer.accept()); }
}  // namespace nplanetary::networking
