# Supabase Database Architecture: Solve Print

This directory contains the organized SQL modular scripts used to power the smart printing queue.

## Folder Structure

| File | Purpose | Key Components |
| :--- | :--- | :--- |
| `01_core_tables.sql` | **Data Structure** | `profiles`, `orders`, `pricing_config`, `documents` |
| `02_automation_triggers.sql` | **Automation** | Auto-updating timestamps, Auto-profile creation on Signup. |
| `03_rls_security_policies.sql` | **Security** | Row Level Security (RLS) to protect customer data. |
| `04_rpc_utility_functions.sql` | **Performance** | `batch_update_order_status` (Batch processing for Owners). |

---

### Key Database Workflows

#### 1. Zero-Config Profile Sync
We use a database trigger `on_auth_user_created`. This means as a developer, you don't need to write code to "create a profile" after signup. Supabase manages it automatically at the database level using the user's `role` and `full_name` metadata.

#### 2. The Busy Owner's "Batch" Logic
The function `batch_update_order_status` is an **RPC (Remote Procedure Call)**. It allows the Shop Owner dashboard to send 10 order IDs at once and mark them as "READY" with a single click, reducing server requests and owner effort.

#### 3. Automatic Privacy
RLS (Row Level Security) is baked into the database. Even if someone discovers the API URL, they **cannot** see another student's uploaded document or 3-digit code because the database itself denies the request unless the `customer_id` matches the `auth.uid()`.

---

## How to Apply Changes
To update the database, execute the files in sequential order (01 -> 04) via the Supabase SQL Editor or a PostgreSQL client.
