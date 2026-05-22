# Excel Import Pipeline

## 1. Current Structure

Phase 3-A introduced a stubbed Excel import surface without real file handling.

- `src/settings/ExcelImportSettings.tsx` owns the current UI state for target selection, sample mapping, sample preview rows, validation issue display, and the disabled apply button.
- `src/utils/excelImportSchema.ts` owns import target schemas, sample rows, draft creation, and preview-row validation.
- `src/types/dashboard.ts` owns the common Excel import draft, mapping, preview row, validation issue, and target types.
- `src/widgets/stubs/ExcelUploadStub.tsx` points users to the full settings panel.

No actual workbook selection, binary parsing, row import, or storage apply path exists yet.

## 2. Problems To Solve

The current stub is useful for UI validation, but it does not yet define strong boundaries for the real import flow.

- UI state, schema lookup, sample draft creation, and validation are close together.
- There is no explicit source adapter boundary for future file selection.
- There is no parser adapter boundary for future workbook parsing.
- Preview rows are display-oriented; they are not an apply plan.
- Student roster import is the only near-term apply candidate, while teacher and class timetable storage models are not settled.

## 3. Phase 3-B Goal

Phase 3-B documents the responsibility boundaries for the future import pipeline. It must not add runtime import behavior.

The goal is to make the next implementation step boring and contained:

- File selection remains stubbed.
- Workbook parsing remains stubbed.
- Validation remains preview-only.
- Apply remains disabled.
- Student roster apply is planned conceptually only.
- Teacher timetable and class timetable apply stay blocked until their storage types and adapters exist.

## 4. Pipeline Stages

### Source

The source stage will eventually produce file metadata and an opaque file handle or payload. It must not live inside the React settings component.

Expected responsibility:

- Track selected file name, size, type, and selection time.
- Report source-level errors such as unsupported extension.
- Avoid parsing workbook contents.

Not allowed in Phase 3-B:

- `FileReader`
- `<input type="file">`
- direct browser file parsing

Phase 3-E source picker boundary:

- `ExcelImportSettings` must not know about `File`, `FileList`, `FileReader`, or `xlsx`.
- A future `<input type="file">` must live inside a dedicated source picker such as `ExcelImportSourcePicker`, not directly in `ExcelImportSettings`.
- The source picker or browser source adapter may own browser-only file details temporarily, but it must emit an `ExcelImportSourceResult` to the settings UI.
- `ExcelImportSourceMeta` is the only source data that should cross into shared UI state.
- A `ready` source result means file metadata has been selected. It does not mean workbook parsing, preview generation, validation, or apply is complete.
- The selected `File` object must not be stored in shared dashboard types, `ExcelImportDraft`, or `ExcelImportSettings` state.

### Parse

The parse stage will eventually convert a workbook source into sheet-like rows. It should be hidden behind an adapter so the app can replace the parser implementation later.

Expected responsibility:

- Read a selected workbook source.
- Return sheets, columns, and raw string values.
- Report parser-level errors.

Not allowed in Phase 3-B:

- `xlsx` dependency
- workbook parsing implementation
- parser calls from UI components

### Mapping

The mapping stage connects source columns to target fields.

Expected responsibility:

- Start from `getImportSchema(target)`.
- Let users inspect source column to target field pairs.
- Eventually support user-edited mappings without changing validation rules.

Current behavior:

- Uses static schema mappings and sample columns.

### Preview

The preview stage shows a bounded set of rows before validation and apply.

Expected responsibility:

- Display row index and source values.
- Keep the table display-only.
- Avoid mutating student, timetable, or dashboard state.

Current behavior:

- Uses sample preview rows from `getSamplePreviewRows`.

### Validation

The validation stage checks mapped preview rows and returns issues.

Expected responsibility:

- Validate required fields.
- Validate simple domain rules such as weekday range and period range.
- Classify issues as `error` or `warning`.
- Stay pure and storage-free.

Forbidden direct connection:

- Validation must never call `saveStudentRosterState`.
- Validation must never call timetable storage.

### Import Plan

The import plan stage is a future dry-run result, not a storage write.

`StudentRosterImportPlan` is a concept for Phase 3-C and later. It should describe what would happen if the user applies the import.

Conceptual fields:

- target: `studentRoster`
- selectedClassId
- candidates derived from preview rows
- issues
- summary counts
- canApply

The plan may say "3 students will be added" or "2 rows are blocked by errors", but it must not save anything by itself.

### Apply

The apply stage is the only stage that may eventually write to app storage. It should be isolated behind a separate apply adapter or service.

Phase 3-B rule:

- Apply remains disabled.
- No Excel import code may call storage.
- No import plan may save directly.

## 5. Stage Responsibility Summary

| Stage | Owns | Must Not Own |
| --- | --- | --- |
| Source | file metadata, source errors | parsing, validation, storage |
| Parse | workbook to sheets/rows | React UI state, storage writes |
| Mapping | source-to-target field mapping | parser internals, storage writes |
| Preview | display rows | data mutation |
| Validation | issues and readiness checks | storage writes |
| Import plan | dry-run apply summary | direct persistence |
| Apply | future storage write | parsing, UI rendering |

## 6. Forbidden Direct Connections

These direct connections should stay forbidden even after real file parsing begins:

- `ExcelImportSettings` -> `File`
- `ExcelImportSettings` -> `FileList`
- UI -> `FileReader`
- UI -> `xlsx`
- `ExcelImportSettings` -> `<input type="file">`
- validation -> `saveStudentRosterState`
- validation -> timetable storage
- import plan -> storage direct save
- parser -> storage direct save
- Excel import -> `saveLessonToolsState`

## 7. StudentRosterImportPlan Concept

Student roster import is the first practical apply target because `StudentRosterState`, `StudentInfo`, and the local storage adapter already exist.

The plan should be generated from mapped preview rows, not from raw workbook bytes.

Conceptual flow:

1. Parse workbook into preview rows.
2. Map columns to `number`, `name`, `gender`, `studentCode`, and `note`.
3. Validate mapped rows.
4. Build a dry-run `StudentRosterImportPlan`.
5. Render summary and row issues.
6. Only in a later phase, ask for explicit apply.

The plan should not silently create schools or classes. It should require an existing selected class.

## 8. Timetable Apply Blocked Principle

`teacherTimetable` and `classTimetable` remain schema and validation targets only.

Their apply stage is blocked until all of the following exist:

- timetable domain types
- timetable storage adapter methods
- migration/fallback policy
- UI ownership decision for teacher vs class timetable data

Until then:

- target selection may show schemas
- preview may show sample rows
- validation may show issues
- apply must stay blocked

## 9. Phase 3-C Minimal Implementation Candidate

Phase 3-C may implement the smallest safe slice if explicitly approved:

- Add file source adapter interfaces.
- Add parser adapter interfaces.
- Keep the default implementation as a stub or test-only fixture.
- Add `StudentRosterImportPlan` type and pure helper functions.
- Generate a plan from sample or parsed rows.
- Keep apply disabled unless the phase explicitly includes a separate apply step.

Preferred file candidates:

- `src/import/excelImportSourceAdapter.ts`
- `src/import/excelWorkbookParserAdapter.ts`
- `src/import/studentRosterImportPlan.ts`
- `src/utils/excelImportValidation.ts`

## 10. Still Forbidden

The following remain forbidden until a later phase explicitly allows them:

- installing `xlsx`
- implementing `FileReader`
- adding `<input type="file">` directly to `ExcelImportSettings`
- storing `File` objects in shared types or settings state
- treating source `ready` as parsed workbook readiness
- connecting Excel import to `saveStudentRosterState`
- connecting Excel import to `saveLessonToolsState`
- implementing `fetch`
- implementing sqlite
- applying teacher timetable imports
- applying class timetable imports
- putting parser logic inside `ExcelImportSettings`
