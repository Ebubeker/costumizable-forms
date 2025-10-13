# Simplified Form Structure

This document explains the new simplified form structure that removes the `form_blocks` table and uses `form_fields` directly.

## What Changed

### Before (Complex Structure)
```
forms
├── form_blocks (container for fields)
│   ├── type: 'input' | 'text' | 'text-and-input'
│   ├── title: string
│   ├── text: string
│   └── form_fields (actual input fields)
│       ├── type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea'
│       ├── label: string
│       ├── placeholder: string
│       └── options: string[]
```

### After (Simplified Structure)
```
forms
└── form_fields (direct fields on form)
    ├── type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea' | 'heading' | 'paragraph'
    ├── label: string (optional for heading/paragraph)
    ├── placeholder: string (optional)
    ├── content: string (for heading/paragraph text)
    └── options: string[] (for select fields)
```

## Key Benefits

1. **Simpler Structure**: No need for intermediate blocks table
2. **More Flexible**: Text content (headings, paragraphs) are now just special field types
3. **Easier to Understand**: Direct relationship between forms and fields
4. **Better Performance**: Fewer joins required for queries

## New Field Types

- `heading`: Displays as a heading (h3) with content
- `paragraph`: Displays as paragraph text with content
- `text`: Text input field
- `email`: Email input field
- `phone`: Phone input field
- `textarea`: Multi-line text input
- `select`: Dropdown selection
- `checkbox`: Checkbox input

## Migration

### Database Migration

Run the migration script to convert existing data:

```sql
-- Run this in your Supabase SQL editor
\i supabase/migration-to-simplified.sql
```

This will:
1. Add new columns to `form_fields` table
2. Migrate text blocks to heading/paragraph fields
3. Update field references to point directly to forms
4. Drop the `form_blocks` table
5. Update indexes and policies

### Code Migration

The new components are available:

- `SimplifiedFormBuilder`: New form builder component
- `SimplifiedFormViewer`: New form viewer component

### API Changes

The API now expects `fields` instead of `blocks`:

```typescript
// Old structure
{
  title: "My Form",
  blocks: [
    {
      type: "text",
      title: "Section Title",
      text: "Section description",
      fields: [
        { type: "text", label: "Name" }
      ]
    }
  ]
}

// New structure
{
  title: "My Form",
  fields: [
    { type: "heading", content: "Section Title" },
    { type: "paragraph", content: "Section description" },
    { type: "text", label: "Name" }
  ]
}
```

## Usage Examples

### Creating a Form with the New Structure

```typescript
const formData = {
  title: "Contact Form",
  description: "Get in touch with us",
  company_id: "your-company-id",
  created_by: "user-id",
  fields: [
    {
      type: "heading",
      content: "Contact Information"
    },
    {
      type: "text",
      label: "Full Name",
      placeholder: "Enter your full name",
      required: true
    },
    {
      type: "email",
      label: "Email Address",
      placeholder: "Enter your email",
      required: true
    },
    {
      type: "paragraph",
      content: "We'll get back to you within 24 hours."
    },
    {
      type: "select",
      label: "How did you hear about us?",
      options: ["Google", "Social Media", "Friend", "Other"]
    }
  ]
};
```

### Using the New Components

```tsx
import { SimplifiedFormBuilder } from '@/components/form-builder/simplified-form-builder';
import { SimplifiedFormViewer } from '@/components/form-builder/simplified-form-viewer';

// Form Builder
<SimplifiedFormBuilder 
  companyId="your-company-id"
  userId="user-id"
  formId="existing-form-id" // optional
/>

// Form Viewer
<SimplifiedFormViewer 
  form={formData}
  onSubmit={handleSubmit}
/>
```

## Backward Compatibility

The old `FormWithBlocks` interface is still available for backward compatibility during migration, but new code should use `FormWithFields`.

## Testing

1. Run the database migration
2. Test the new form builder at `/forms/simplified`
3. Verify existing forms still work
4. Test form submission and response handling

## Files Modified

- `supabase/schema-simplified.sql` - New simplified schema
- `supabase/migration-to-simplified.sql` - Migration script
- `types/database.ts` - Updated type definitions
- `app/api/forms/route.ts` - Updated API endpoints
- `app/api/forms/[id]/route.ts` - Updated form CRUD operations
- `lib/forms.ts` - Updated service methods
- `components/form-builder/simplified-form-builder.tsx` - New form builder
- `components/form-builder/simplified-form-viewer.tsx` - New form viewer
