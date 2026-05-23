# Excel Import Pipeline

## 1. Current Structure

Phase 3-A introduced a stubbed Excel import surface without real file handling.

- `src/settings/ExcelImportSettings.tsx` owns the current UI state for target selection, sample mapping, sample preview rows, validation issue display, and the disabled apply button.
- `src/utils/excelImportSchema.ts` owns import target schemas, sample rows, draft creation, and preview-row validation.
- `src/types/dashboard.ts` owns the common Excel import draft, mapping, preview row, validation issue, and target types.
- `src/widgets/stubs/ExcelUploadStub.tsx` points users to the full settings panel.

No actual workbook selection, binary parsing, row import, or storage apply path exists yet.

Completed Phase 3 source/parser boundary work:

- `ExcelImportSourcePicker` owns the file input boundary.
- Selected files produce source metadata only: file name, size, MIME type, selection time, and last modified time.
- `ExcelImportSettings` displays metadata but does not know about `File`, `FileList`, `FileReader`, `xlsx`, or parser execution.
- `BrowserExcelParserBoundary` exists as a blocked skeleton for future browser-only parsing.
- `noopBrowserExcelParserBoundary` returns an `ExcelWorkbookParseResult` with `status: "blocked"` and `workbook: null`.
- The parser boundary contract is type-checked, but no parser implementation is connected.

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

Phase 3-J parser introduction rule:

- File reading and workbook parsing must stay separate phases.
- `FileReader` may only be introduced inside a browser import/parser boundary, never in `ExcelImportSettings`.
- `xlsx` must not be introduced in the same step as the first `FileReader` boundary unless a later phase explicitly allows that combined risk.
- `ExcelWorkbookParserAdapter.parseSource(source: ExcelImportSourceMeta)` is metadata-only and is not sufficient for real file parsing by itself.
- `BrowserExcelParserBoundary` is the future owner of browser-only `File`/`FileReader` access and should emit `ExcelWorkbookParseResult`, not preview rows or import plans.
- Parser output must not be stored directly and must not create `StudentRosterImportPlan` directly.

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

## 5.1 Future Phase Order

The remaining Excel import work should open one responsibility at a time:

1. Source metadata
2. FileReader boundary
3. ArrayBuffer acquisition
4. `xlsx` workbook parsing
5. Raw sheet rows extraction
6. Preview rows generation
7. Validation
8. `StudentRosterImportPlan` dry-run
9. Explicit import apply
10. Storage persistence

Do not collapse these phases into a single implementation. In particular, file reading, workbook parsing, preview generation, import-plan creation, and storage writes must be independently reviewable.

## 5.2 Responsibility Boundaries

- `ExcelImportSourcePicker`: owns file selection and shallow metadata creation.
- `BrowserExcelParserBoundary`: owns browser-only `File`/`FileReader` access when that phase opens.
- `ExcelWorkbookParserAdapter`: owns workbook/raw sheet parsing behind a replaceable parser adapter.
- Preview/mapper layer: owns preview row creation and validation-facing row shape.
- Import plan layer: owns `StudentRosterImportPlan` dry-run generation after validation.
- Storage layer: owns persistence only after an explicit apply action.
- `ExcelImportSettings`: owns display and user controls only; it must not own File APIs, parser execution, import plans, or storage writes.

## 5.3 Phase 3-J-C FileReader Boundary Skeleton

Phase 3-J-C defines the FileReader boundary without implementing file reading.

Allowed in this phase:

- Document the future browser-only file reading boundary.
- Keep `BrowserExcelParserBoundary` blocked by default.
- Clarify that the boundary may later acquire an `ArrayBuffer` before parser work begins.
- Keep parser result, source result, preview rows, import plans, and storage writes separate.

Still forbidden in this phase:

- Creating a `FileReader` instance.
- Calling any `readAs...` method.
- Installing or importing `xlsx`.
- Parsing workbooks or worksheets.
- Generating preview rows from a selected file.
- Creating `StudentRosterImportPlan`.
- Calling storage adapters from Excel import code.
- Moving parser execution into `ExcelImportSettings`.
- Adding parser responsibility to `ExcelImportSourcePicker`.

The intended future flow is:

1. `ExcelImportSourcePicker` keeps file selection and metadata responsibility.
2. A browser parser boundary owns the selected browser file handle internally.
3. A later FileReader phase may convert that handle into an `ArrayBuffer`.
4. A still later parser phase may convert the binary payload into workbook/raw sheet data.
5. Preview, validation, import plan, and apply remain downstream phases.

## 5.4 Phase 3-J-E Parser Input Contract

Phase 3-J-E defines the future parser input shape without creating bytes or running a parser.

The current parser adapter contract is metadata-only:

```ts
parseSource(source: ExcelImportSourceMeta): Promise<ExcelWorkbookParseResult>
```

That is not enough for real file parsing because metadata cannot contain workbook bytes. A future parser implementation should receive an input shape like:

```ts
type ExcelWorkbookParseInput = {
  source: ExcelImportSourceMeta;
  buffer: ArrayBuffer;
};
```

This contract is only a boundary candidate in Phase 3-J-E. The app must not create an `ArrayBuffer` yet.

The separation should remain:

- `ExcelImportSourceResult`: source metadata and source-level issues only.
- `ExcelWorkbookParseInput`: future parser input after browser-only byte acquisition.
- `ExcelWorkbookParseResult`: parser output with workbook/raw sheet data or parser issues.
- Preview rows: created by a mapper/preview layer after parsing.
- Validation: runs after preview row generation.
- `StudentRosterImportPlan`: dry-run output after validation.
- Storage apply: explicit user action after a valid plan.

The browser boundary should eventually own `File` and byte acquisition. `ExcelImportSettings` and `ExcelImportSourcePicker` should still avoid parser execution.

## 5.5 Phase 3-J-F CSV/Template-First Roster Strategy

Phase 3-J-F chooses a first import strategy for student rosters:

```text
CSV or strict template first.
.xlsx full workbook parsing stays deferred for a separate later review.
```

This is a strategy decision only. It does not implement file reading, CSV parsing, workbook parsing, preview generation, validation code, import plans, or storage writes.

Reasons:

- Student rosters contain personal information, so browser-client processing should remain the default and server upload should stay out of scope.
- Full `.xlsx` workbook parsing has larger bundle, security, browser memory, and type-safety risks than a narrow CSV/template flow.
- Student roster rows are structurally simple, so a strict template is easier to validate, explain, and recover from when a teacher uploads the wrong shape.
- `.xlsx` support may still be necessary for school compatibility, but it is too broad for the first real parser phase.

Minimum field candidates for a future roster template:

- `className` or `classId`
- `studentNumber`
- `studentName`
- Optional status fields for later review: `absent`, `late`, `earlyLeave`, `officialAbsent`

Do not create runtime types or validation code for those fields in this phase.

The stage order remains:

```text
source metadata
-> file read boundary
-> parser input
-> raw rows
-> preview rows
-> validation
-> StudentRosterImportPlan dry-run
-> explicit apply
-> storage persistence
```

CSV/template strategy does not relax the existing gates:

- Validation must run before an import plan exists.
- Preview rows must exist before apply can be considered.
- `ExcelImportSettings` must not call File APIs or parser APIs directly.
- Source results and parser results must stay separate.

## 6. Forbidden Direct Connections

These direct connections should stay forbidden even after real file parsing begins:

- `ExcelImportSettings` -> `File`
- `ExcelImportSettings` -> `FileList`
- UI -> `FileReader`
- UI -> `xlsx`
- `ExcelImportSettings` -> `<input type="file">`
- `ExcelImportSettings` -> parser boundary execution
- source result -> parser result mixed state
- parser result -> storage direct save
- parser result -> `StudentRosterImportPlan` without preview and validation
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

## 11. Next Phase Candidates

The next phase should still avoid real `xlsx` workbook parsing. Reasonable next steps are:

- Phase 3-J-G: review the CSV/template schema candidates without parser code.
- Phase 3-J-H: verify the blocked/noop runtime boundary for future file reading.
- Phase 3-K-A: review the smallest possible FileReader boundary implementation.

Still forbidden in these next candidates unless explicitly opened:

- installing `xlsx`
- installing a CSV parser
- importing `XLSX`
- parsing CSV files
- parsing workbooks or worksheets
- generating preview rows from a real file
- creating `StudentRosterImportPlan`
- applying imported data to storage
