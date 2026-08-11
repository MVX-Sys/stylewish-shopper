---
title: Authentication Infrastructure Reset
description: Completely overhaul the email authentication and role-based access control system to resolve persistent infrastructure errors.
---

## Goals
- Fix the `500: Database error querying schema` error in Supabase Auth.
- Ensure the `has_role` and `has_permission` functions are bulletproof.
- Provision the requested administrative users (`lucas`, `caitano`, `funcionario`) with proper roles.
- Update the UI to reflect the functional authentication system.

## Technical Details
- **Schema Reset**: Recreate the `app_role` enum and the `user_roles`/`user_permissions` tables with proper grants.
- **Security Definer Functions**: Implement `has_role` and `has_permission` using `SECURITY DEFINER` to bypass RLS recursion and permission issues.
- **Grants**: Explicitly grant `USAGE` on the `public` schema to `anon`, `authenticated`, and `authenticator` roles.
- **User Provisioning**: Ensure users exist and have the correct roles in the database.
- **UI Update**: Revert the temporary heading and ensure the login flow is robust.

## Implementation Plan
1. **Reset Database Schema**: Apply the SQL script to recreate roles and functions (already initiated).
2. **Provision Users**: Create or update the requested users in the backend.
3. **Update Application Code**: Refine the `AuthPage` and `AuthProvider` to handle errors gracefully.
4. **Verify**: Test the login flow for all roles.
