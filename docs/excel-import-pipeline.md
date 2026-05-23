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

## 5.6 Phase 3-J-G Roster CSV Template Schema Candidate

Phase 3-J-G reviews the student roster CSV/template schema without implementing a parser, alias mapper, validation code, import plan, or storage apply.

Recommended first schema:

```text
className
studentNumber
studentName
```

Why `className` first:

- Teachers can understand and fill `className` more easily than an internal `classId`.
- The current settings UI already exposes human-readable class display names.
- `classId` is an internal identifier and should not be required in a teacher-facing template.
- A later import flow can resolve `className` to an existing class before building an import plan.

Column name candidates:

| Field | Korean aliases | English aliases |
| --- | --- | --- |
| `className` | `반`, `학급` | `className` |
| `studentNumber` | `번호` | `studentNumber` |
| `studentName` | `이름`, `성명` | `studentName` |

Do not implement alias mapping in this phase. These are documentation-only candidates.

`studentNumber` principles:

- Numeric values and numeric strings may be accepted in a future parser.
- The future mapper should normalize values for display and sorting.
- Empty values should be validation error candidates.
- Duplicate numbers should be validation error candidates within the same resolved class.

`studentName` principles:

- Leading and trailing whitespace should be trimmed in a future mapper.
- Empty names should be validation error candidates.
- Whether to normalize or preserve internal spaces should be reviewed later.

Optional status fields remain deferred for the first implementation:

```text
absent
late
earlyLeave
officialAbsent
```

Reasoning:

- Attendance is date-based in the dashboard data model.
- Roster import and attendance import should not be merged into the first parser flow.
- The first implementation should focus on stable roster identity fields.

Validation rule candidates only:

- Required columns exist.
- Required cells are not empty after trim.
- Student numbers are unique within the resolved class.
- Student names are not empty.
- Unknown columns are ignored with a warning or shown as unmapped.
- Header row is limited to row 1 until a later phase explicitly allows flexible headers.

## 5.7 Phase 3-J-H Roster CSV Validation Rule Candidates

Phase 3-J-H breaks the roster CSV/template validation rules into reviewable candidates. It does not implement validation code, parser code, alias mapping, import plans, or storage apply.

Required column candidates:

```text
className
studentNumber
studentName
```

Header alias candidates stay documentation-only:

| Field | Korean aliases | English aliases |
| --- | --- | --- |
| `className` | `반`, `학급` | `className` |
| `studentNumber` | `번호` | `studentNumber` |
| `studentName` | `이름`, `성명` | `studentName` |

Required cell candidates:

- Empty `className` should be a validation error candidate.
- Empty `studentNumber` should be a validation error candidate.
- Empty `studentName` should be a validation error candidate.

`studentNumber` validation candidates:

- Numeric values and numeric strings may be accepted.
- Values should be trimmed before future normalization.
- Sorting should use numeric order after normalization.
- Duplicate numbers inside the same `className` should be validation error candidates.
- Leading zero policy, such as `01`, is deferred because it can affect display and sorting expectations.

`studentName` validation candidates:

- Leading and trailing whitespace should be trimmed.
- Empty values after trim should be validation error candidates.
- Internal spaces should be preserved in the first implementation candidate.
- Special character restrictions should stay permissive at first to avoid rejecting real names too aggressively.

Header row policy candidates:

- Header row should be limited to row 1 in the first implementation candidate.
- Automatic header detection should be deferred.
- Header aliases should remain a documented candidate until an alias mapper phase explicitly opens.

Unknown column policy candidates:

- Unknown columns may be ignored with a warning or displayed as unmapped.
- Missing required columns should be validation error candidates.
- Optional status fields such as `absent`, `late`, `earlyLeave`, and `officialAbsent` should be ignored or warned in the first roster-only flow.

Error message structure candidate:

```text
level: error | warning
rowNumber?: number
columnName?: string
message: string
```

Do not add this as a TypeScript type in Phase 3-J-H.

Validation separation rules:

- Documenting validation rules does not mean validation code exists.
- `StudentRosterImportPlan` must not be created before validation.
- Apply must not be considered before preview rows exist.
- Parser results and validation results must stay separate.
- `ExcelImportSettings` must not call parser or validation logic directly.

## 5.8 Phase 3-K-G-A CSV Parser Contract Candidate

Phase 3-K-G-A defines the CSV parser contract before installing a parser package or reading real CSV rows. It does not implement CSV parsing, Excel parsing, row preview, validation, alias mapping, import plans, UI changes, or storage writes.

The pipeline order remains:

```text
FileReader boundary
-> parser boundary
-> parsed preview summary
-> row preview
-> validation
-> alias mapping
-> import plan
-> storage apply
```

Responsibility split:

- FileReader boundary: owns browser `File` access and byte acquisition only.
- Parser boundary: owns conversion from an already-approved parser input into parser-level summary or later row preview data.
- Parsed preview summary: may report `status`, `source`, `rowCount`, `columnCount`, and `issues` only.
- Row preview: opens later and may expose bounded display rows only after the parser contract is reviewed again.
- Validation: runs after row preview exists and must stay outside the parser boundary.
- Alias mapping: runs after parser output exists and must stay outside the parser boundary.
- Import plan: may be created only after preview, validation, and mapping are explicit.
- Storage apply: may happen only after an explicit user action in a later phase.

CSV parser boundary decisions:

1. CSV parser boundary vs FileReader boundary
   - FileReader remains responsible for browser file access.
   - CSV parser code must not create `FileReader` or call `readAs...` APIs.
   - A future CSV parser may receive text produced by a dedicated file-read/decoding phase, but that decoding phase is not open yet.

2. Parser input shape
   - The parser should not receive `File`, `FileList`, React events, or UI state.
   - The current `ExcelParsedPreviewResult` is sufficient for the first summary result contract.
   - If a later phase opens CSV text decoding, it should define a narrow parser input such as source metadata plus decoded text. That type must be reviewed before implementation.
   - The first CSV parser phase should not pass `ArrayBuffer` through React state or settings callbacks.

3. Encoding boundary
   - Encoding detection and text decoding are their own phase.
   - `TextDecoder`, `readAsText`, BOM handling, and EUC-KR/CP949 policy are not part of Phase 3-K-G-A.
   - The first implementation should prefer a well-reviewed package or explicit decoding rule instead of ad hoc string handling.

4. Minimum parser result
   - The first parser result should stay at parsed preview summary level:
     - `status`
     - `source`
     - `rowCount`
     - `columnCount`
     - `issues`
   - It must not include raw rows, cells, header names, student names, or mapped domain data.

5. Row preview gate
   - Row preview is not opened in this phase because it exposes actual file contents.
   - It needs separate limits for maximum displayed rows, sensitive data handling, and error recovery.
   - Opening row preview before parser summary would make validation and alias mapping harder to review independently.

6. Validation and alias mapping gate
   - Parser boundary should answer "what did the file contain structurally?"
   - Validation should answer "is the content acceptable for this import target?"
   - Alias mapping should answer "which source columns map to target fields?"
   - Keeping them separate prevents parser code from silently becoming import logic.

7. Package installation gate
   - Package installation is deferred so bundle size, browser compatibility, license, and parsing behavior can be reviewed separately.
   - Papa Parse remains the likely CSV-first candidate, but Phase 3-K-G-A does not install or import it.
   - `xlsx`, `read-excel-file`, and `exceljs` stay deferred for a later XLSX review.

If Papa Parse is introduced later, the first implementation target should be:

```text
decoded CSV text
-> parser boundary
-> rowCount / columnCount summary
-> unsupported or summary-only UI
```

It should not include header inference, validation, alias mapping, import plans, storage writes, or full row preview.

XLSX support should be reconsidered after the CSV-first parser boundary has proven:

- source/file-read state stays out of settings internals
- parser result and validation result stay separate
- row preview can be bounded and reviewed
- import plan generation remains blocked until validation exists

Next phase candidates:

- Phase 3-K-G-B: CSV parser package installation preflight review.
- Phase 3-K-G-C: Papa Parse installation and CSV `rowCount`/`columnCount` preview summary only.
- Phase 3-K-G-D: CSV row preview contract review without validation or import apply.

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

- Phase 3-J-I: verify the blocked/noop runtime boundary for future file reading.
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
