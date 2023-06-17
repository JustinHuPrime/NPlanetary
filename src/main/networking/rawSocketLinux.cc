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

#if defined(__linux__)

#include <netdb.h>
#include <poll.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <unistd.h>

#include <cstring>
#include <memory>
#include <stdexcept>
#include <thread>
#include <utility>

#include "networking/rawSocket.h"

using namespace std;
using namespace std::chrono;

namespace nplanetary::networking {
RawSocket::RawSocket(string const &hostname, std::stop_token stopFlag)
    : fd(0), stopFlag(stopFlag) {
  // do DNS lookup
  struct addrinfo hints = {};
  hints.ai_flags = AI_V4MAPPED | AI_ADDRCONFIG | AI_IDN | AI_NUMERICSERV;
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  string portString = to_string(PORT);
  struct addrinfo *rawResult;
  if (int retval =
          getaddrinfo(hostname.c_str(), portString.c_str(), &hints, &rawResult);
      retval != 0) {
    throw runtime_error("could not lookup host: "s + gai_strerror(retval));
  }
  unique_ptr<struct addrinfo, decltype(&freeaddrinfo)> result =
      unique_ptr<struct addrinfo, decltype(&freeaddrinfo)>(rawResult,
                                                           freeaddrinfo);

  // try each result in sequence
  for (struct addrinfo const *candidate = result.get(); candidate != nullptr;
       candidate = candidate->ai_next) {
    if (fd = socket(candidate->ai_family, candidate->ai_socktype | SOCK_CLOEXEC,
                    candidate->ai_protocol);
        fd == -1) {
      continue;
    }

    if (connect(fd, candidate->ai_addr, candidate->ai_addrlen) != -1) {
      break;
    }

    close(fd);
    fd = 0;
  }

  if (fd == 0) {
    // failed to connect
    throw runtime_error("could not connect to "s + hostname);
  }
}

RawSocket::RawSocket(RawSocket &&other) noexcept {
  fd = other.fd;
  stopFlag = other.stopFlag;

  other.fd = 0;
}

RawSocket::~RawSocket() noexcept {
  if (fd != 0) {
    close(fd);
  }
}

RawSocket &RawSocket::operator=(RawSocket &&other) noexcept {
  swap(fd, other.fd);
  stopFlag = other.stopFlag;
  return *this;
}

RawSocket::operator bool() const noexcept { return fd != 0; }

void RawSocket::read(uint8_t *buf, size_t count) {
  // cancel on this if need be
  if (stopFlag.stop_requested()) {
    throw stopFlag;
  }

  // poll fd for input
  struct pollfd polled {
    .fd = fd, .events = POLLIN, .revents = 0,
  };
  switch (poll(&polled, 1, 10)) {
    case 1: {
      // something happened to fd
      if ((polled.revents & POLLERR) != 0) {
        // socket error
        int error;
        socklen_t optlen = sizeof(int);
        getsockopt(fd, SOL_SOCKET, SO_ERROR, &error, &optlen);
        throw runtime_error("could not read from socket: socket error: "s +
                            strerror(error));
      } else if ((polled.revents & POLLNVAL) != 0) {
        // polling error
        throw runtime_error("invalid fd: "s + to_string(fd));
      } else if ((polled.revents & POLLIN) != 0) {
        // can read
        ssize_t retval = ::read(fd, buf, count);
        if (retval == 0) {
          // end of data
          throw HangupFlag();
        } else if (retval != -1) {
          if (retval == count) {
            // read all data
            return;
          } else {
            // more data left
            buf += retval;
            count -= retval;
            return read(buf, count);
          }
        } else {
          // error
          int error = errno;
          switch (error) {
            case EAGAIN:
            case EINTR: {
              // retry
              return read(buf, count);
            }
            case EPIPE: {
              // hangup
              throw HangupFlag();
            }
            default: {
              throw runtime_error("could not read from socket: "s +
                                  strerror(error));
            }
          }
        }
      } else {
        // hangup, no data left
        throw HangupFlag();
      }
    }
    case 0: {
      // nothing happened; retry
      return read(buf, count);
    }
    case -1: {
      // error
      int error = errno;
      switch (error) {
        case EINTR: {
          // interrupted by signal; retry
          return read(buf, count);
        }
        default: {
          throw runtime_error("could not read from socket: "s +
                              strerror(error));
        }
      }
    }
    default: {
      abort();
    }
  }
}

void RawSocket::write(uint8_t const *buf, size_t count) {
  // cancel on this if need be
  if (stopFlag.stop_requested()) {
    throw stopFlag;
  }

  // poll fd for output
  struct pollfd polled {
    .fd = fd, .events = POLLOUT, .revents = 0,
  };
  switch (poll(&polled, 1, 10)) {
    case 1: {
      // something happened to fd
      if ((polled.revents & POLLERR) != 0) {
        // socket error
        int error;
        socklen_t optlen = sizeof(int);
        getsockopt(fd, SOL_SOCKET, SO_ERROR, &error, &optlen);
        throw runtime_error("could not write to socket: socket error: "s +
                            strerror(error));
      } else if ((polled.revents & POLLNVAL) != 0) {
        // polling error
        throw runtime_error("invalid fd: "s + to_string(fd));
      } else if ((polled.revents & POLLHUP) != 0) {
        // disconnected
        throw HangupFlag();
      } else {
        // can write
        ssize_t retval = ::write(fd, buf, count);
        if (retval != -1) {
          if (retval == count) {
            // wrote all data
            return;
          } else {
            // more data left
            buf += retval;
            count -= retval;
            return write(buf, count);
          }
        } else {
          // error
          int error = errno;
          switch (error) {
            case EAGAIN:
            case EINTR: {
              // retry
              return write(buf, count);
            }
            case EPIPE: {
              // hangup
              throw HangupFlag();
            }
            default: {
              throw runtime_error("could not write to socket: "s +
                                  strerror(error));
            }
          }
        }
      }
    }
    case 0: {
      // nothing happened; retry
      return write(buf, count);
    }
    case -1: {
      // error
      int error = errno;
      switch (error) {
        case EINTR: {
          // interrupted by signal; retry
          return write(buf, count);
        }
        default: {
          throw runtime_error("could not write to socket: "s + strerror(error));
        }
      }
    }
    default: {
      abort();
    }
  }
}

RawSocket::RawSocket(int fd, stop_token stopFlag) noexcept
    : fd(fd), stopFlag(stopFlag) {}

RawServer::RawServer(stop_token stopFlag) : fd(0), stopFlag(stopFlag) {
  // setup for bind lookup
  struct addrinfo hints = {};
  hints.ai_flags = AI_PASSIVE | AI_V4MAPPED | AI_ADDRCONFIG | AI_NUMERICSERV;
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  string portString = to_string(PORT);
  struct addrinfo *rawResult;
  if (int retval = getaddrinfo(nullptr, portString.c_str(), &hints, &rawResult);
      retval != 0) {
    throw runtime_error("could not search for bindable socket: "s +
                        gai_strerror(retval));
  }
  unique_ptr<struct addrinfo, decltype(&freeaddrinfo)> result =
      unique_ptr<struct addrinfo, decltype(&freeaddrinfo)>(rawResult,
                                                           freeaddrinfo);

  // try each result in sequence
  for (struct addrinfo const *candidate = result.get(); candidate != nullptr;
       candidate = candidate->ai_next) {
    if (fd = socket(candidate->ai_family, candidate->ai_socktype | SOCK_CLOEXEC,
                    candidate->ai_protocol);
        fd == -1) {
      continue;
    }

    int one = 1;
    setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &one, sizeof(int));

    if (bind(fd, candidate->ai_addr, candidate->ai_addrlen) != -1) {
      break;
    }

    close(fd);
    fd = 0;
  }

  if (fd == 0) {
    // failed to bind
    throw runtime_error("could not bind to socket");
  }

  // listen on socket
  if (int retval = listen(fd, QUEUE_LENGTH); retval != 0) {
    close(fd);
    throw runtime_error("could not listen on socket: "s + strerror(errno));
  }
}

RawServer::RawServer(RawServer &&other) noexcept {
  fd = other.fd;
  stopFlag = other.stopFlag;

  other.fd = 0;
}

RawServer::~RawServer() noexcept {
  if (fd != 0) close(fd);
}

RawServer &RawServer::operator=(RawServer &&other) noexcept {
  swap(fd, other.fd);
  stopFlag = other.stopFlag;
  return *this;
}

RawSocket RawServer::accept() {
  // cancel on this if need be
  if (stopFlag.stop_requested()) {
    throw stopFlag;
  }

  // poll fd for input
  struct pollfd polled {
    .fd = fd, .events = POLLIN, .revents = 0,
  };
  switch (poll(&polled, 1, 10)) {
    case 1: {
      // something happened to fd
      if ((polled.revents & POLLERR) != 0) {
        // socket error
        int error;
        socklen_t optlen = sizeof(int);
        getsockopt(fd, SOL_SOCKET, SO_ERROR, &error, &optlen);
        throw runtime_error("could not accept on socket: socket error: "s +
                            strerror(error));
      } else if ((polled.revents & POLLNVAL) != 0) {
        // polling error
        throw runtime_error("invalid fd: "s + to_string(fd));
      } else if ((polled.revents & POLLIN) != 0) {
        // can accept
        int connFD = ::accept(fd, nullptr, nullptr);
        if (connFD != -1) {
          // got a socket
          return RawSocket(connFD, stopFlag);
        } else {
          // error
          int error = errno;
          switch (error) {
            case EAGAIN:
            case EINTR:
            case ECONNABORTED:
            case ENETDOWN:
            case EPROTO:
            case ENOPROTOOPT:
            case EHOSTDOWN:
            case ENONET:
            case EHOSTUNREACH:
            case EOPNOTSUPP:
            case ENETUNREACH: {
              // retry
              return accept();
            }
            default: {
              throw runtime_error("could not read from socket: "s +
                                  strerror(error));
            }
          }
        }
      } else {
        // hangup - this shouldn't happen
        throw runtime_error("hangup on passive socket");
      }
    }
    case 0: {
      // nothing happened; retry
      return accept();
    }
    case -1: {
      // error
      int error = errno;
      switch (error) {
        case EINTR: {
          // interrupted by signal; retry
          return accept();
        }
        default: {
          throw runtime_error("could not accept on socket: "s +
                              strerror(error));
        }
      }
    }
    default: {
      abort();
    }
  }
}
}  // namespace nplanetary::networking

#endif
