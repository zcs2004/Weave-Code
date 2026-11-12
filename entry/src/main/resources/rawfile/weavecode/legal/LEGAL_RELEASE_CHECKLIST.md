# Weave Code legal release checklist

This checklist records the legal and source-release work that remains before a
public Weave Code binary or hosted modified version is released. It is a release
control document, not legal advice.

## Completed in the 1.0.2 working tree

- The complete GNU Affero General Public License version 3 text is stored in
  `LICENSE` and is available from the in-app Help menu.
- Project and third-party attributions are stored in `NOTICE`.
- Phoenix provenance and the categories of Weave Code modifications are recorded
  in `UPSTREAM.md`.
- The 51 extension ZIP files in the 1.0.2 extension mirror are byte-for-byte
  identical to the extension set covered by `EXTENSION_LICENSES.md`.
- The public source location is displayed in the About dialog and recorded in
  the legal documents.
- No `.p8` IAP private-key file is present in the built HAP.

## Blocking items before public release

- Identify and record the exact Phoenix commit or release used by the embedded
  editor runtime. Do not infer or guess this revision.
- Publish the complete corresponding source for the exact distributed build at
  <https://github.com/zcs2004/Weave-Code>, including local changes, dependency
  locks, build scripts, and installation information.
- Resolve or remove `response-for-brackets-0.1.0.zip`: its package metadata does
  not declare a license and its archive contains no recognizable license or
  NOTICE file.
- Resolve or remove `talmand.html-templates-1.3.5.zip`: its package metadata does
  not declare a license and its archive contains no recognizable license or
  NOTICE file.
- Reconcile `NOTICE` and every bundled license against the final dependency and
  extension versions included in the release HAP.
- Record the Weave Code source commit, build-instruction revision, signed HAP
  SHA-256, and notice audit date in `UPSTREAM.md` for the released artifact.
- Keep all private keys and other production secrets out of the publication
  tree and Git history. The 1.0.2 working tree must not contain a Huawei IAP
  `.p8` file; the real key belongs only in the protected server configuration.
  Rotate or revoke any key that has previously been exposed outside its intended
  server environment.

No release should be described as source-complete or legally cleared while any
blocking item above remains unresolved.
