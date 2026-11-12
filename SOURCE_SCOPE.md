# Public source scope

The public tree is intentionally limited to the material needed to study and
build the Weave Code 1.0.2 HarmonyOS client.

Included:

- HarmonyOS application and module source;
- the web runtime and resources packaged into the HAP;
- dependency locks and build configuration;
- localization and client-side account/IAP integration;
- required notices, license text and provenance records.

Excluded because they are not HAP build inputs:

- signing certificates, keystores, passwords and provisioning profiles;
- AGConnect project configuration and Huawei private keys;
- independent production account/IAP/SMS server implementation and deployment
  configuration;
- product-review spreadsheets, application-store screenshots and marketing
  assets;
- the separately deployed subscription-agreement website;
- generated HAPs, build intermediates, IDE state and dependency caches;
- one-time internal migration, mirroring and artwork-generation tools.

These exclusions do not permit omitting Corresponding Source required by the
GNU AGPL for the covered client program. `UPSTREAM.md` and
`LEGAL_RELEASE_CHECKLIST.md` record the remaining source-completeness blockers.
