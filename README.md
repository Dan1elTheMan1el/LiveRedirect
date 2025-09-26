<p align="center">
  <img src="DynamicRedirect%20Extension/images/icon-128.png" alt="LiveRedirector icon" width="96" height="96" />
</p>

# LiveRedirector

Open matching webpages in [LiveContainer](https://github.com/LiveContainer/LiveContainer) from Safari on iOS using a lightweight Safari Web Extension.

# Note: iOS 26 broke the Safari extension when sideloading, so use the following guide to setup the new userscript:

- Install [UserScripts](https://apps.apple.com/ca/app/userscripts/id1463298887) for free from the App Store
- Identify your UserScripts directory
- Install the LiveRedirector shortcut and select the UserScripts folder during setup
- Use the shortcut to configure userscript settings

# iOS 18:

## What it does
- Lets you maintain a list of URL or domain patterns (e.g., `discord.com/invite`, `youtube.com`).
- When a visited page matches, the content script encodes the full URL as Base64 and redirects to:
  `livecontainer://open-web-page?url=<base64>`
- Manage patterns directly in the extension popup (add, delete, import, export).

## Using the extension

**Important: Sideload with app extensions enabled to use extension!**

- Add a pattern such as `discord.com/invite` or just `github.com`.
- Visit a matching page; you should be redirected to the LiveContainer URL.
- Import/Export via clipboard (JSON or newline list). The popup performs clipboard reads/writes only on user action.

### Pattern matching rules
- Host only: `github.com` matches any path on that host (and subdomains).
- Host + path: `discord.com/invite` matches any URL whose path starts with `/invite`.
- Scheme-agnostic patterns are supported: `//discord.com/invite` or `*://discord.com/invite`.
- Exact/full-URL and prefix matches (with scheme) also work.

## Permissions
- `storage` for saving URL patterns locally.
- `clipboardRead`/`clipboardWrite` for import/export in the popup (user-initiated only).
- `<all_urls>` to allow matching on all pages (content script runs at `document_start`).

## Notes
- Mostly written by ChatGPT for personal use, do not expect troubleshooting support
- This is not affiliated with LiveContainer. Do not message the developers for any issue you encounter using this extension.
