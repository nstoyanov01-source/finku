<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into Finku, a React + Vite + React Router v6 freelance finance tracker for Bulgarian freelancers. PostHog (`posthog-js` + `@posthog/react`) was installed and initialized in `src/main.jsx` with the EU host and wrapped in `PostHogProvider`. User identification via `posthog.identify()` is called on login, signup, and on Dashboard mount. Error tracking was added to the existing `ErrorBoundary` via `posthog.captureException`. Fourteen business-critical events were instrumented across 9 files covering the full user lifecycle: from signup and onboarding through daily financial data entry, CSV imports, invoice generation, and tax planning.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User creates a new account via email or Google OAuth | `src/pages/Auth.jsx` |
| `user_logged_in` | User logs in to an existing account | `src/pages/Auth.jsx` |
| `onboarding_language_selected` | User selects preferred language during onboarding | `src/pages/LanguageSelect.jsx` |
| `onboarding_legal_form_selected` | User selects legal/work form and completes onboarding | `src/pages/LegalFormSelect.jsx` |
| `income_added` | User adds a new income entry | `src/components/AddEntryModal.jsx` |
| `income_updated` | User updates an existing income entry | `src/components/AddEntryModal.jsx` |
| `income_deleted` | User deletes an income entry | `src/components/AddEntryModal.jsx`, `src/components/EntryDrawer.jsx` |
| `expense_added` | User adds a new expense entry | `src/components/AddEntryModal.jsx` |
| `expense_updated` | User updates an existing expense entry | `src/components/AddEntryModal.jsx` |
| `expense_deleted` | User deletes an expense entry | `src/components/EntryDrawer.jsx` |
| `csv_imported` | User imports transactions from a Revolut CSV file | `src/components/CSVImport.jsx` |
| `invoice_generated` | User generates and prints an invoice PDF | `src/pages/NewInvoice.jsx` |
| `tax_breakdown_viewed` | User expands the tax calculation breakdown on the dashboard | `src/pages/Dashboard.jsx` |
| `tax_payment_marked_paid` | User marks a tax/insurance payment as paid | `src/pages/Dashboard.jsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/192550/dashboard/729413)
- [Onboarding conversion funnel](https://eu.posthog.com/project/192550/insights/PaPIqhXw)
- [New signups over time](https://eu.posthog.com/project/192550/insights/X3nnmWLi)
- [Income & expense entries added](https://eu.posthog.com/project/192550/insights/eHrX9ngr)
- [Invoice generation trend](https://eu.posthog.com/project/192550/insights/RQ6z6fmU)
- [Feature adoption: CSV import & tax breakdown](https://eu.posthog.com/project/192550/insights/ZvkkcLRa)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
