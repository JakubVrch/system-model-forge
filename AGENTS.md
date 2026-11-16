# Spec Kit

This repository uses Spec Kit. Before feature work, read
`.specify/memory/constitution.md` and the relevant artifacts in `specs/`.

The Codex skills are in `.agents/skills/speckit-*/SKILL.md`. When the user
requests a Spec Kit stage, read and follow the corresponding skill. Treat
`$speckit-plan`, `/speckit-plan`, and `speckit.plan` as requests for the same
stage (and likewise for the other stages). Use the user's accompanying text
where the skill refers to `$ARGUMENTS`; it is not a shell environment variable.

Available stages: `specify`, `clarify`, `plan`, `tasks`, `analyze`, `implement`,
`checklist`, `constitution`, `converge`, and `taskstoissues`.

Run the bundled scripts from the repository root. Resolve the active feature
with `bash .specify/scripts/bash/check-prerequisites.sh --json --paths-only`
instead of guessing from the Git branch or choosing the highest numbered spec.
Run the prerequisite checks required by the selected skill before that stage.
Read skill files directly if they are not listed in the current session's
skill picker. Follow the requested stage without automatically starting the
entire workflow.

For TypeScript implementation changes, use `npm run typecheck`, `npm test`,
and `npm run build` as appropriate. Integration-only changes can be checked
with `specify integration status` and the bundled prerequisite scripts.
