# Renivet security patch

This directory contains the MIT-licensed `picomatch` 4.0.7 source with the
single-branch repeated-extglob ReDoS fix from upstream pull request #238,
commit `44f192261f312ddf236cb7bdc05d8f22663f98f9`. The patch is tracked while
the upstream project has not published a fixed npm release.

The package metadata uses the internal version `4.0.8-renivet.0` so the lock
file and audit identify this as a distinct, locally patched build rather than
claiming it is the upstream 4.0.8 release. `tests/picomatch-security.test.ts`
covers the reported payloads and non-risky repeated patterns. Reconcile this
fork with a published upstream fix and remove it at that time.
