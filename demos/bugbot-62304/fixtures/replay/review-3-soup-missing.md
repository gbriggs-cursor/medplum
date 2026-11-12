> REPLAY (no key). Authored from `.cursor/BUGBOT.md`; not a captured Bugbot review.

**Bugbot: high risk**

Class C: dependency change without a SOUP update. `packages/react/package.json` adds `date-fns`, and `demos/_shared/regulatory/SOUP.md` is unchanged.

Missing from the `SOUP.md` diff:

- `date-fns`
