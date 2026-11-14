## Summary

Describe the change and why it is useful to kits or hosts.

## Screenshots

- Add screenshots for a changed component or icon, in the Paper and the Graphite skin.
- If there is no visual change, write `No visual change`.

## Verification

- [ ] `pnpm check` exits 0
- [ ] Added or updated a test, or explained why one was not needed
- [ ] Generated files regenerated (`pnpm build`, `pnpm build:docs`) and committed, not edited by hand
- [ ] A new or changed component has its docs page and demos (`site/src/docs/`)

## Compatibility

- [ ] No `kui-` class name, exported name, or prop that kits use was renamed or removed, or the
      change is listed in `CHANGELOG.md` under **Changed** with how to move
- [ ] No Kit Harness Protocol theme token (`khp`) was added, renamed, or removed
- [ ] No credentials, host-specific paths, or generated local data are included
