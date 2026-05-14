---
title: "Running Windows apps and Linux tools on Android"
date: "2026-03-01"
---

Two tools that make Android a surprisingly capable platform for running software that was never designed for it.

## Winlator

[Winlator](https://winlator.org/) runs Windows x86_64 software on Android. No PC required, no streaming — the execution happens on the phone.

The stack underneath it:

- **Wine** — translates Windows API calls to POSIX equivalents
- **Box86/Box64** — JIT-translates x86_64 instructions to ARM, the architecture all Android phones actually run
- **PRoot** — a containerized Ubuntu environment providing system libraries
- **Mesa (Turnip/Zink/VirGL) + DXVK/VKD3D** — translate DirectX calls to Vulkan or OpenGL

The result is that a game or application compiled for Windows sees what looks like a normal Windows runtime, while underneath everything is being translated twice: Win32 API → Unix, and x86_64 → ARM.

Performance is limited by that double translation layer and by mobile GPU capabilities, but lighter games and productivity apps run. BrunoSX (the developer) credits ptitSeb's Box64 work as the foundation that made this feasible.

Distributed free via GitHub releases, with optional donations.

## Termux

[Termux](https://termux.dev/en/) is an Android terminal emulator and Linux environment that requires no root and no setup beyond installing the app. It drops you into a Bash shell with a package manager backed by a repository of ~25,000 packages compiled for Android's Bionic libc.

What you can do out of the box:

- **SSH** into remote servers via OpenSSH
- **Compile code** with Clang — C, C++, Go, Rust, Swift
- **Run interpreters** — Python, Ruby, Perl, Node.js
- **Use standard Unix tools** — grep, curl, rsync, tar, git
- **Attach hardware** — Bluetooth keyboard, external display, full mouse support

It's not a Linux VM or emulation layer. Packages are compiled natively for Android/ARM, and you're running directly on the Android kernel. The limitation is Bionic instead of glibc, which means some software needs patching to build.

Termux has real sponsorship behind it (GitHub Accelerator, NLnet NGI Mobifree, Cloudflare, Warp), which shows in the package quality and maintenance pace.

## How they differ

| | Winlator | Termux |
|---|---|---|
| Target audience | Windows game/app users | Developers, sysadmins |
| Execution model | Wine + JIT translation | Native ARM binaries |
| Root required | No | No |
| Performance overhead | High (double translation) | Near-zero |
| Use case | Run existing Windows software | Unix environment on the go |

Winlator is "run things that weren't built for Android" via emulation. Termux is "Android is a Linux device, let it act like one."
