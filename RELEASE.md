# Release

- Pushing a version tag triggers the CI pipeline to build and publish the release.
- Release notes must be added manually if required.

## Notes

- Version is controlled by root `package.json`. `src/package.json` just holds a dummy to follow convention.
- Version is then injected in script via `--config.extraMetadata.version=$npm_package_version`

## Major Release

Prepare:

```bash
git checkout -b release/1.0.0
git commit -m 'chore: version bump'
git push origin release/1.0.0
```

Release:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Merge back changes to main:

```bash
git checkout main
git merge release/1.0.0
git push
```

## Hotfix/Bugfix Release

Prepare:

```bash
git checkout release/1.0.0
git pull
```

Fix:

```bash
git checkout -b hotfix/fix-some-crash
git commit -m 'Fix crash when doing something'
git checkout release/1.0.0
git merge hotfix/fix-some-crash
```

Release:

```bash
git tag v1.0.1
git push origin v1.0.1
```

Merge back changes to main:

```bash
git checkout main
git merge release/1.0.0
git push
```
