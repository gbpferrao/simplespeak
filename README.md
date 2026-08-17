# SimpleSpeak

SimpleSpeak is a local-first visual vocabulary-learning prototype. This Git
repository contains the app source, bundled assets, generated language-pack
data, and version history.

## Workspace map

The project keeps its canonical documents and implementation control records in
sibling folders outside this repository:

| Sibling folder | Role | Authority |
| --- | --- | --- |
| `C:\dev\simplespeak-spec-docs` | Reconciled product, architecture, design, data, and release specifications | Canonical specification set; start with `README.md` and `00-reconciled-current-spec.md` |
| `C:\dev\simplespeak-implementation` | CI/CD guideline, implementation plans, deep-dives, notes, and verification logs | Canonical implementation control record; start with `README.md` |
| `C:\dev\simplespeak-centerline-review` | Centerline tracing, consistent-stroke image generation, contact sheets, and visual review outputs | Asset-production review input; not runtime or specification authority |

The sibling document folders are intentionally outside the app repository and
are not part of the GitHub backup. The app repository is the source/assets and
version-control boundary. When implementation changes, update the owning spec
and create a cycle log in `simplespeak-implementation`.

For the current product contract, read:

`C:\dev\simplespeak-spec-docs\00-reconciled-current-spec.md`

For the implementation workflow, read:

`C:\dev\simplespeak-implementation\README.md`
