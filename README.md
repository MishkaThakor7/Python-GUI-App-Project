# Python-GUI-App-Project
# Stonecroft Heritage Lettings

An administration system for a fictional letting agency that specialises in restored heritage and character homes
(Cape Dutch, Victorian, Edwardian, Art Deco), using South African heritage grades (Grade I, IIA, IIB, IIIC).

It has four pages: **Login → Property Register → Tenant Enquiries → Dashboard & Reports**, and exists in two versions.

| Version | Folder | Built with |
|---|---|---|
| Browser | repo root (`index.html`, `css/`, `js/`) | HTML, CSS, vanilla JavaScript |
| Desktop | `desktop/` | Python, PyQt5, Qt Designer |

**Demo login (both versions):** `demo` / `heritage123`

## Features

- **Login** with success and failure messages
- **Property register:** calendar for the available-from date (past dates blocked), heritage grade and style, rent, description, and a list of standout features
- **Tenant enquiries:** viewing date and time, occupants, move-in urgency (radio buttons) and desired amenities (checkboxes)
- **Dashboard:** property count and live clock (LCD displays), viewing-interest progress bar, rent-escalation dial, and a searchable table
- **Export report** as a text file

## Browser version

Open `index.html` in any browser. No install or server needed. Entries are kept in the browser's local storage, so they
survive a refresh but are not shared between browsers or devices.

To publish it: repository **Settings → Pages**, then deploy from the `main` branch root.

The login check runs in the browser, so it is a demo and not real security.

## Desktop version (PyQt5)

```
pip install -r desktop/requirements.txt
```

The window layout is designed in Qt Designer. `main.py` imports the interface generated from it, so these files
must sit next to `main.py` (add them from your own project):

1. `heritagelettings.ui`: the Qt Designer file
2. `logoresource.qrc`: the resource file that points at `assets/stonecroft_logo_transparent.png`

Generate the Python modules, then run:

```
pyuic5 heritagelettings.ui -o heritagelettings.py
pyrcc5 logoresource.qrc -o logoresource_rc.py
python main.py
```

Data lives in memory while the app runs. **Export Report** writes `stonecroft_report.txt` to the working folder.

## Structure

```
index.html            browser version
css/style.css
js/app.js
desktop/
  main.py             PyQt5 application logic
  requirements.txt
  assets/             logo (SVG and transparent PNG)
```

## Colour palette

Whitewashed-wall background (`#f7f4ee`), Cape Dutch shutter green (`#2f4a3c`) as the primary colour, and thatch gold
(`#c08a2e`) as the accent. A dark theme follows the system setting.
