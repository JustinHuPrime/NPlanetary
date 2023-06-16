# Architecture

User-visible form is a desktop app

Server to client is encrypted and authenticated based on the password; a PBKDF is used for AEAD based on a shared password (symmetric encryption)