# Aurora

**Aurora** is a lightweight, open-source, cross-platform music player built for audiophiles and casual listeners alike.  
It focuses on a clean interface, local playback, and full user control — without ads, tracking, or cloud dependencies.

![Main UI](docs/images/screenshot-main-ui.png)

---

## Features

- Add and manage music by selecting local directories
- Browse music by album and artist
- Playlist management (create, edit, reorder — stored locally)
- Playback queue management
- Support for common and lossless audio formats
- Clean, distraction-free UI
- Works and tested on **macOS**, **Windows**, and **Linux** builds are being currently tested.

---

## Privacy & Security

Aurora is designed to be **fully local-first**:

- ❌ No telemetry
- ❌ No analytics
- ❌ No user tracking
- ❌ No background network requests
- ✅ All data stays on your machine

Aurora does not collect, store, or transmit any personal or usage data.

---

## macOS — Important Notice (Unsigned App)

Aurora is currently **not code-signed or notarized** because it is distributed as an independent open-source project without an Apple Developer
account.

### What this means

When you open Aurora on macOS for the first time, you may see:

> “Aurora cannot be opened because the developer cannot be verified.”

### How to open Aurora safely

1. Download the `.dmg` from **GitHub Releases**
2. Drag **Aurora.app** into your **Applications** folder
3. Right-click **Aurora.app** → **Open**
4. Click **Open** again when prompted
5. (Optional) After first launch, macOS will trust the app normally

Aurora does **nothing malicious** — this warning exists purely because the app is unsigned.

---

## Installation

### macOS

- Download the `.dmg` from the **Releases** page
- Drag Aurora into Applications
- Follow the steps above to bypass Gatekeeper

### Windows / Linux

_Coming Soon_

---

## Development

### Prerequisites

- Node.js `^20.19.5`
- Yarn `^1.22.22`

### Run in development

```bash
git clone https://github.com/bbbneo333/aurora.git
cd aurora
yarn install
yarn start
```

## Packaging

```bash
yarn package
```

Artifacts will be generated in the `release` output directory.

## Releasing

See [RELEASE](./RELEASE.md)

## Bug Reports & Feedback

- Report bugs via GitHub Issues
- Feature requests and discussions are welcome

Please open an issue with:

- Clear steps to reproduce
- Expected vs actual behavior
- OS and Aurora version
- Screenshots or logs if available

👉 https://github.com/bbbneo333/aurora/issues

## License

Aurora is released under the MIT License.
See [LICENSE](./LICENSE) for details.
