# Project Status Logic

## Overview

The ReqGenAI system uses a 5-stage status workflow to track project progress from creation to implementation.

## Status Definitions

### 1. **Created**

- **When**: Any input/project is initially created
- **Trigger**: User creates a project using any input method (Manual, Voice, Transcript, File)
- **Color**: Gray
- **Icon**: Plus sign

### 2. **Processing**

- **When**: Project is in active development stages
- **Includes**:
  - `requirement-extracted` - Requirements have been extracted from input
  - `brd` - Business Requirements Document is being generated
  - `blueprint` - Technical blueprint is being created
  - `processing` - General processing state
- **Color**: Yellow
- **Icon**: Clock

### 3. **Implemented**

- **When**: User clicks implementation and gets success response from Bitrix24
- **Trigger**: Successful Bitrix24 project creation
- **Color**: Green
- **Icon**: Checkmark

### 4. **Rejected**

- **When**: Project stage is rejected
- **Trigger**: Manual rejection or system rejection
- **Color**: Red
- **Icon**: X mark

### 5. **Total Requirements**

- **When**: All projects regardless of status
- **Purpose**: Overall project count
- **Color**: Blue
- **Icon**: Document

## Status Transitions

```
Created → Processing → Implemented
   ↓           ↓
Rejected ← Rejected
```

## Dashboard Display

The dashboard shows 5 status cards:

1. **Total Requirements** - Count of all projects
2. **Created** - Count of projects with `created` status
3. **Processing** - Count of projects with `processing`, `requirement-extracted`, `brd`, or `blueprint` status
4. **Implemented** - Count of projects with `implemented` status
5. **Rejected** - Count of projects with `rejected` status

## Backend Implementation

### Status Updates

- **Created**: Set when project is created via `/api/inputs/*` endpoints
- **Processing**: Set during requirement extraction, BRD generation, or blueprint creation
- **Implemented**: Set when Bitrix24 integration succeeds in `/api/actions/bitrix24/create-project/:projectId`
- **Rejected**: Set manually or by system logic

### Database Schema

```javascript
status: {
  type: String,
  default: "created",
  enum: [
    "created",
    "requirement-extracted",
    "brd",
    "blueprint",
    "implemented",
    "processing",
    "rejected"
  ]
}
```

## Frontend Implementation

### Status Filtering

- Dashboard filter dropdown shows: All Status, Created, Processing, Implemented, Rejected
- Status cards automatically count projects in each category
- Status badges on project cards show appropriate colors and labels

### Status Colors

- **Created**: `bg-gray-100 text-gray-800`
- **Processing**: `bg-yellow-100 text-yellow-800`
- **Implemented**: `bg-green-100 text-green-800`
- **Rejected**: `bg-red-100 text-red-800`
