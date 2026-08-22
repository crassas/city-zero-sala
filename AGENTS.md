# Graph Engineer — Controlled Change Contract

This project is fail-closed. An agent may only change the exact paths named in
`ACTIVE_CHANGE_SCOPE.json`.

Before editing:

1. Read `ACTIVE_CHANGE_SCOPE.json` and `PROTECTED_PATHS.json`.
2. Refuse work when the mission id is missing, expired, or the target path is not allowed.
3. Never widen the allowlist, edit the guard, or alter protected files.
4. Replace obsolete code; do not append a second implementation beside it.
5. Run `npm run verify:change-scope`, `npm run lint`, and `npm run build`.
6. Report the files actually changed and the verification result.

If a required change touches a protected path, create a proposal only. Do not
apply it. A temporary owner override must be supplied outside the repository.

The protected agent may never modify its own protection.
