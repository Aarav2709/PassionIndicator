# PassionIndicator

A minimal dark study timer for the web.

The app keeps one main dashboard, a fullscreen study overlay, and a simple subject list. The interface uses Poppins everywhere and stays focused on time, not decoration.

<table>
  <tr>
    <td align="center">
      <img src="screenshots/home.png" width="400"><br>
      <b>Home Screen</b>
    </td>
    <td align="center">
      <img src="screenshots/study.png" width="400"><br>
      <b>Study Screen</b>
    </td>
  </tr>
</table>

## What it does

The dashboard shows total study time and break time.

Each subject can be started, renamed, or deleted.

Starting a subject opens a fullscreen timer view with a clear green state while studying and a red state while on break.

## Run it

```bash
npm install
npm run dev
```

## Build it

```bash
npm run build
```

## Notes

The project is intentionally small for now. Extra screens and navigation were removed so the main study flow stays simple.
