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

#include <algorithm>
#include <iostream>  // TODO: debug only
#include <limits>
#include <utility>

using namespace std;

namespace nplanetary::networking {
struct SodiumInit {
  SodiumInit() { initialized = sodium_init() != -1; }

  bool initialized;
} sodiumInit;

CryptoSocket::CryptoSocket(string const &hostname, string const &password,
                           stop_token const &stopFlag)
    : CryptoSocket(RawSocket(hostname, stopFlag), password) {}

void CryptoSocket::read(uint8_t *buf, size_t n) {
  // do we require more chunks?
  if (recvBuffer.empty()) {
    pull();
  }

  // how large is the first chunk?
  if (recvBuffer.front().size() >= n) {
    // take as much as needed
    copy(recvBuffer.front().begin(), recvBuffer.front().begin() + n, buf);
    if (recvBuffer.front().size() == n) {
      recvBuffer.pop_front();
    } else {
      recvBuffer.front().erase(recvBuffer.front().begin(),
                               recvBuffer.front().begin() + n);
    }
  } else {
    // take all, recurse
    copy(recvBuffer.front().begin(), recvBuffer.front().end(), buf);
    size_t copied = recvBuffer.front().size();
    recvBuffer.pop_front();
    read(buf + copied, n - copied);
  }
}
void CryptoSocket::write(uint8_t const *buf, size_t n) {
  copy(buf, buf + n, back_inserter(sendBuffer));
  if (sendBuffer.size() >= 4096) {
    flush();
  }
}
void CryptoSocket::flush() {
  if (sendBuffer.empty()) {
    return;
  }

  // calculate size of chunk to send
  uint16_t sendSize;
  if (sendBuffer.size() > numeric_limits<uint16_t>::max()) {
    sendSize = numeric_limits<uint16_t>::max();
  } else {
    sendSize = sendBuffer.size();
  }

  // send header
  array<uint8_t, sizeof(uint16_t)> plaintextHeader;
  plaintextHeader[0] = (sendSize >> 0) & 0xff;
  plaintextHeader[1] = (sendSize >> 8) & 0xff;

  array<uint8_t,
        sizeof(uint16_t) + crypto_secretstream_xchacha20poly1305_ABYTES>
      ciphertextHeader;
  crypto_secretstream_xchacha20poly1305_push(
      &sendState, ciphertextHeader.data(), nullptr, plaintextHeader.data(),
      plaintextHeader.size(), nullptr, 0, 0);
  rawSocket.write(ciphertextHeader.data(), ciphertextHeader.size());

  // send message
  unique_ptr<uint8_t[]> ciphertext = make_unique<uint8_t[]>(
      sendSize + crypto_secretstream_xchacha20poly1305_ABYTES);
  crypto_secretstream_xchacha20poly1305_push(&sendState, ciphertext.get(),
                                             nullptr, sendBuffer.data(),
                                             sendSize, nullptr, 0, 0);
  rawSocket.write(ciphertext.get(),
                  sendSize + crypto_secretstream_xchacha20poly1305_ABYTES);
  sendBuffer.erase(sendBuffer.begin(), sendBuffer.begin() + sendSize);

  // recurse until send buffer is empty
  return flush();
}

CryptoSocket::CryptoSocket(RawSocket rawSocket, std::string const &password)
    : rawSocket(move(rawSocket)) {
  // setup sending

  // run keygen
  array<uint8_t, crypto_secretstream_xchacha20poly1305_KEYBYTES> key;
  array<uint8_t, crypto_pwhash_scryptsalsa208sha256_SALTBYTES> salt;
  randombytes_buf(salt.data(), salt.size());
  this->rawSocket.write(salt.data(), salt.size());
  if (crypto_pwhash_scryptsalsa208sha256(
          key.data(), key.size(), password.c_str(), password.size(),
          salt.data(), crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_INTERACTIVE,
          crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_INTERACTIVE) != 0) {
    throw runtime_error("ran out of memory while hashing password for send");
  }

  // make header
  array<uint8_t, crypto_secretstream_xchacha20poly1305_HEADERBYTES> header;
  crypto_secretstream_xchacha20poly1305_init_push(&sendState, header.data(),
                                                  key.data());
  this->rawSocket.write(header.data(), header.size());

  // setup receiving

  // run keygen
  this->rawSocket.read(salt.data(), salt.size());
  if (crypto_pwhash_scryptsalsa208sha256(
          key.data(), key.size(), password.c_str(), password.size(),
          salt.data(), crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_INTERACTIVE,
          crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_INTERACTIVE) != 0) {
    throw runtime_error("ran out of memory while hashing password for recv");
  }

  // read header
  this->rawSocket.read(header.data(), header.size());
  if (crypto_secretstream_xchacha20poly1305_init_pull(&recvState, header.data(),
                                                      key.data()) != 0) {
    throw runtime_error("invalid header");
  }

  // final handshake

  // generate test packet
  array<uint8_t, VERIFICATION_PACKET_SIZE> sendVerify;
  randombytes_buf(sendVerify.data(), sendVerify.size());

  // send packet
  array<uint8_t,
        VERIFICATION_PACKET_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES>
      sendVerifyCiphered;
  crypto_secretstream_xchacha20poly1305_push(
      &sendState, sendVerifyCiphered.data(), nullptr, sendVerify.data(),
      sendVerify.size(), nullptr, 0, 0);
  this->rawSocket.write(sendVerifyCiphered.data(), sendVerifyCiphered.size());

  // get other side's test packet
  array<uint8_t,
        VERIFICATION_PACKET_SIZE + crypto_secretstream_xchacha20poly1305_ABYTES>
      recvVerifyCiphered;
  this->rawSocket.read(recvVerifyCiphered.data(), recvVerifyCiphered.size());

  // decrypt
  array<uint8_t, VERIFICATION_PACKET_SIZE> recvVerify;
  if (crypto_secretstream_xchacha20poly1305_pull(
          &recvState, recvVerify.data(), nullptr, nullptr,
          recvVerifyCiphered.data(), recvVerifyCiphered.size(), nullptr,
          0) != 0) {
    throw runtime_error("invalid message detected");
  }

  // reply
  crypto_secretstream_xchacha20poly1305_push(
      &sendState, recvVerifyCiphered.data(), nullptr, recvVerify.data(),
      recvVerify.size(), nullptr, 0, 0);
  this->rawSocket.write(recvVerifyCiphered.data(), recvVerifyCiphered.size());

  // get reply packet
  this->rawSocket.read(recvVerifyCiphered.data(), recvVerifyCiphered.size());

  // decrypt
  if (crypto_secretstream_xchacha20poly1305_pull(
          &recvState, recvVerify.data(), nullptr, nullptr,
          recvVerifyCiphered.data(), recvVerifyCiphered.size(), nullptr,
          0) != 0) {
    throw runtime_error("invalid message detected");
  }

  if (sendVerify != recvVerify) {
    throw PasswordMismatchFlag();
  }
}

void CryptoSocket::pull() {
  // read header
  array<uint8_t,
        sizeof(uint16_t) + crypto_secretstream_xchacha20poly1305_ABYTES>
      ciphertextHeader;
  array<uint8_t, sizeof(uint16_t)> plaintextHeader;

  rawSocket.read(ciphertextHeader.data(), ciphertextHeader.size());
  if (crypto_secretstream_xchacha20poly1305_pull(
          &recvState, plaintextHeader.data(), nullptr, nullptr,
          ciphertextHeader.data(), ciphertextHeader.size(), nullptr, 0) != 0) {
    throw runtime_error("invalid message detected");
  }

  uint16_t dataLength = (static_cast<uint16_t>(plaintextHeader[0]) << 0) |
                        (static_cast<uint16_t>(plaintextHeader[1]) << 8);

  // read message
  unique_ptr<uint8_t[]> ciphertext = make_unique<uint8_t[]>(
      dataLength + crypto_secretstream_xchacha20poly1305_ABYTES);
  vector<uint8_t> plaintext = vector<uint8_t>(dataLength);

  rawSocket.read(ciphertext.get(),
                 dataLength + crypto_secretstream_xchacha20poly1305_ABYTES);
  if (crypto_secretstream_xchacha20poly1305_pull(
          &recvState, plaintext.data(), nullptr, nullptr, ciphertext.get(),
          dataLength + crypto_secretstream_xchacha20poly1305_ABYTES, nullptr,
          0)) {
    throw runtime_error("invalid message detected");
  }

  recvBuffer.emplace_back(move(plaintext));
}

CryptoServer::CryptoServer(string const &password, stop_token const &stopFlag)
    : rawServer(stopFlag), password(password) {}

CryptoSocket CryptoServer::accept() {
  return CryptoSocket(rawServer.accept(), password);
}
}  // namespace nplanetary::networking
