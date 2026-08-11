## 🔗 Linked Issue
Fixes # (replace with linked issue number, e.g. Fixes #1)

## 📋 Summary of Changes
Brief description of what this PR introduces or fixes.

## 🧪 Verification & Test Results
Describe how these changes were tested and verified.

## 🛡️ Security & Constraints Check
- [ ] RLS policies verified (`auth.uid() = user_id`)
- [ ] Composite Foreign Keys enforced (`UNIQUE (id, user_id)`)
- [ ] No monetary floating-point numbers (`bigint` used for IDR)
- [ ] Engine math verified against PRD deterministic rules
