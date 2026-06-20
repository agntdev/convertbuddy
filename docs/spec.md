# ConvertBuddy — refined brief

## Summary
ConvertBuddy is a Telegram bot that converts between a small set of units (length, weight, temperature) and lets each Telegram user save favorite unit pairs. It exposes simple commands (/start, /convert, /fav, /favs) and persists favorites in Redis via the provided toolkit. The bot validates input and returns clear usage/errors.

## Audience
Telegram users who need quick unit conversions in chat (individuals; not a group-shared favorites experience).

## Core entities
- User (Telegram user id)
- Unit categories: length, weight, temperature
- Units (allowed codes): length: km, m, mi, ft; weight: kg, lb; temperature: c, f
- Favorite pair: a stored tuple (from_unit, to_unit) belonging to a single user

## Supported conversions & formulas
- Length
  - 1 km = 1000 m
  - 1 mi = 1.609344 km
  - 1 m = 3.2808398950131 ft
  - Use combinations of the above to convert between any length units
- Weight
  - 1 kg = 2.2046226218488 lb
- Temperature
  - C → F: F = C * 9/5 + 32
  - F → C: C = (F - 32) * 5/9

All conversions are only allowed within the same category (e.g., km → mi OK; km → kg not allowed).

Results are returned as decimal numbers rounded to 6 significant digits by default (see Assumptions & defaults).

## Integrations & notification targets
- Redis (via the provided toolkit) for persistent storage of per-user favorites.
- Telegram Bot API for messaging.

No external notification targets (email, Slack, etc.).

## Interaction flows
- /start
  - Reply: short welcome message and one-line usage hint (mention /convert and /fav).

- /convert <value> <from> <to>
  - Behavior:
    - If missing args: reply with usage: "/convert <value> <from> <to> — e.g. /convert 10 km mi".
    - Parse <value> as a floating-point number (dot as decimal separator).
    - Normalize <from> and <to> to lower-case unit codes and validate membership in the allowed units list.
    - If units are unknown: reply "Unknown unit: <unit>. Supported: km, m, mi, ft, kg, lb, c, f.".
    - If units belong to different categories: reply "Incompatible units — conversions are only within the same category (length, weight, temperature).".
    - If value is non-numeric: reply "Value must be a number.".
    - On success: reply with a concise result: "<value> <from> = <converted_value> <to>" and include the conversion formula/precision if helpful.
    - Examples:
      - "/convert 5 km mi" → "5 km = 3.106856 mi"
      - "/convert 32 f c" → "32 f = 0 c"

- /fav <from> <to>
  - Behavior:
    - Validate both units as above and that they are in the same category.
    - Save the pair for the requesting Telegram user in Redis (per-user favorites set); duplicates are ignored.
    - Reply on success: "Saved favorite: <from> → <to>".
    - On invalid input: reply with the same validation error messages as /convert.
    - Limit: users may store up to 100 favorites (see Assumptions & defaults).

- /favs
  - Behavior:
    - Retrieve the list of saved favorite pairs for the Telegram user from Redis.
    - If none: reply "No favorites saved. Use /fav <from> <to> to add one.".
    - If present: reply with a numbered list of favorites, e.g. "1) km → mi\n2) c → f".

General rules
- All command-parsing and validation must handle invalid input gracefully and return a clear single-line error message suitable for chat.
- Units are accepted case-insensitively (e.g., KM, Km, km all valid).

## Persistence
- Redis is used for per-user storage of favorite pairs. Each user's favorites are a Redis set under the key pattern: "convertbuddy:favs:{telegram_user_id}".
- Each favorite entry stored as the short string "<from>:<to>" (lower-cased), ensuring uniqueness.

## Payments
- No payments or billing integrations.

## Non-goals
- No extra unit categories beyond those listed.
- No group-shared favorites (favorites are per-user only).
- No inline-mode or deep keyboard UI beyond plain command replies and simple text buttons.
- No analytics/tracking beyond Redis favorites storage.

## Error messages (exact suggested text)
- Missing args on /convert: "Usage: /convert <value> <from> <to> — e.g. /convert 10 km mi"
- Value non-numeric: "Value must be a number. Use a dot for decimals, e.g. 1.5"
- Unknown unit: "Unknown unit: <unit>. Supported: km, m, mi, ft, kg, lb, c, f."
- Incompatible units: "Incompatible units — conversions are only within the same category (length, weight, temperature)."
- /fav success: "Saved favorite: <from> → <to>"
- /favs empty: "No favorites saved. Use /fav <from> <to> to add one."

## Assumptions & defaults
- Favorites are stored per-Telegram-user in Redis under the key pattern "convertbuddy:favs:{telegram_user_id}" - keeps users' favorites private and scoped to their account.
- Supported unit codes are limited to: km, m, mi, ft, kg, lb, c, f (case-insensitive) - follows the owner's requested concise scope.
- Unit input is parsed case-insensitively and must match the short codes above (no long names or symbols) - simplifies parsing and avoids ambiguous synonyms.
- Numeric parsing accepts dot-based floats only (e.g., 1.5) and rejects locale commas - simplifies implementation and error messaging.
- Convert results are rounded to 6 significant digits - provides readable results while retaining reasonable precision.
- Favorites are stored as Redis SET entries of the string "<from>:<to>" (lower-cased); duplicate favorites are ignored - ensures idempotent saves.
- Per-user favorites are capped at 100 entries to prevent unbounded Redis growth; /fav returns an error if the limit is reached - keeps storage predictable.
- Bot token will be provided via environment variable BOT_TOKEN and Redis credentials via the toolkit's config - standard secure defaults for deployment.
- No group-shared favorites, no payments, and no additional unit categories will be implemented unless requested later - keeps scope small and delivery fast.


This brief contains all decisions required to build ConvertBuddy: commands, validations, storage, unit list, formulas, error messages, and sensible operational defaults.