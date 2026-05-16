# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-12

Initial Release

## [1.1.0] - 2026-05-16

### Added

- Added support for lazy loading DOM for Albums/Artists view
- Added support for checking latest release
- Added support for mtime based syncing
- Added support for syncing via FS stream
- Added support for caching album artworks
- Added support for tinting media player based on current playing track artwork
- Added support for Windows OS

### Fixed

- Fixed broken link to issues in README
- Fixed "FourCC contains invalid characters" issue when parsing some files in MacOS
- Fixed issue where last processed track to an album always sets and overwrites the Album artist
- Fixed issue where app crashes when encounters error while parsing ID3 tags
- Fixed issue where app crashes when loading state saved in local storage
- Fixed issues with text breaking when showing long names for track album / artist names
- Fixed issues with app not working on Intel mac
- Fixed inconsistent placement for liked icon on media player
- Fixed issues where app crashes when encountering permission issues while syncing
