# Schema-Specific Audio Folder Organization

## Overview
Implemented schema-specific audio folder organization to prevent file conflicts and improve organization. Each schema now has its own dedicated subfolder within the `/audio` directory.

## Changes Made

### 1. Schema Type Definition (`src/types/schema.ts`)
- **Added** `audioFolderPath?: string` property to `SchemaDefinition` interface
- **Created** `getSchemaAudioPath(schema)` utility function that:
  - Returns custom `audioFolderPath` if defined
  - Otherwise generates path from schema ID: `/audio/{schema-id}`
  - Sanitizes ID to lowercase with hyphens

### 2. Schema Creation (`src/components/SchemaDiscoveryWizard.tsx`)
- **Updated** schema creation to generate `audioFolderPath` on new schema creation
- Pattern: `/audio/{sanitized-schema-id}`
- Example: `schema-1234567890` → `/audio/schema-1234567890`

### 3. Schema Variant Creation (`src/components/ImportCSVDialog.tsx`)
- **Updated** `createSchemaVariant()` to generate `audioFolderPath` for new schema variants
- Uses sanitized schema ID: `/audio/{custom-schema-name}`
- Example: "Debt Collection - ACME" → `/audio/debt-collection-acme`

### 4. Import Flow (`src/components/ImportCSVDialog.tsx`)
- **Added** automatic audio path population based on selected schema
- **Added** lock/unlock toggle for custom path override
  - 🔓 **Auto mode** (default): Automatically uses schema's audio path
  - 🔒 **Locked mode**: Allows manual path customization
- **Updated** audio URL construction to use schema-specific path
- **Enhanced** UI with inline help text explaining auto vs. custom path

### 5. Upload Flow (`src/components/UploadDialog.tsx`)
- **Added** `activeSchema` prop to UploadDialog
- **Updated** to require schema selection before upload
- **Enhanced** to construct schema-specific paths: `{schemaAudioPath}/{filename}`
- **Updated** CallRecord to include:
  - `schemaId` and `schemaVersion`
  - `metadata.audioPath` with full schema-specific path
- **Improved** UI to show target schema and destination path
- **Added** schema path validation before upload

### 6. CallsView Integration (`src/components/views/CallsView.tsx`)
- **Updated** UploadDialog instantiation to pass `activeSchema` prop

## Audio Folder Structure

### Before
```
/audio/
  ├── call1.mp3
  ├── call2.mp3
  └── call3.mp3
```

### After
```
/audio/
  ├── debt-collection/
  │   ├── call1.mp3
  │   └── call2.mp3
  ├── loan-servicing/
  │   └── call3.mp3
  └── customer-support/
      └── call4.mp3
```

## User Experience

### Importing CSV with Schema
1. Select a schema (or auto-detect)
2. Audio folder path **automatically populates** from schema
3. Click 🔓 to unlock and customize if needed
4. Import proceeds with schema-specific audio paths

### Uploading Audio Files
1. Ensure schema is selected in CallsView
2. Click "Upload Calls"
3. Dialog shows:
   - Target schema name
   - Destination audio folder path
4. Select audio files
5. Files are uploaded with schema-specific metadata

### Creating New Schema
1. Use Schema Discovery Wizard or Import CSV "Save as new"
2. Schema automatically gets `audioFolderPath` property
3. Future imports/uploads use this path

## Benefits

### Organization
- Audio files grouped by schema/use case
- Easy to locate files for specific projects
- Clear separation between different data collections

### Prevention
- No file name conflicts between schemas
- Each schema has isolated audio storage
- Safer multi-tenant or multi-project usage

### Flexibility
- Auto-generated paths for convenience
- Manual override available when needed
- Backward compatible (defaults to `/audio` if not set)

## Migration Notes

### Existing Schemas
- Schemas without `audioFolderPath` will auto-generate path on first use
- No breaking changes to existing data
- `getSchemaAudioPath()` provides fallback logic

### Existing Audio Files
- Files in `/audio` root remain accessible
- New files will use schema-specific paths
- No automatic migration required

## Technical Details

### Path Generation
```typescript
function getSchemaAudioPath(schema: SchemaDefinition): string {
  if (schema.audioFolderPath) {
    return schema.audioFolderPath;
  }
  const sanitizedId = schema.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  return `/audio/${sanitizedId}`;
}
```

### Path Sanitization
- Converts to lowercase
- Replaces non-alphanumeric (except hyphens) with hyphens
- Example: "Debt Collection V1" → "debt-collection-v1"

### Schema Creation Pattern
```typescript
audioFolderPath: `/audio/${sanitizedId}`
```

## Future Enhancements

### Potential Additions
- [ ] Audio file browser by schema
- [ ] Bulk audio file migration tool
- [ ] Storage usage analytics per schema
- [ ] Audio file validation on upload
- [ ] Automatic folder creation on server

### Considerations
- Server-side storage integration
- Azure Blob Storage path mapping
- CDN configuration for audio delivery
