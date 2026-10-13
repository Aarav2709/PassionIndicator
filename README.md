# PassionIndicator

A minimal dark study timer for the web. Recreation of Yeolpumta for Desktop, but very stripped down and minimal. The app keeps one main dashboard, a fullscreen study overlay, and a simple subject list. The interface uses Poppins everywhere and stays focused on time, not decoration.

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
PassionIndicator mixes three apps: the flight metaphor of FocusFlight, the pomodoro rhythm of Pomofocus and the study tracking of Yeolpumta.

- Every study session is a flight. Pick a subject, type how long you want to fly and choose from real routes with realistic flight times.
- While you focus, your plane taxis, climbs, cruises and descends across a dot matrix world map with live speed and altitude.
- Leaving fullscreen or switching tabs puts the flight in a holding pattern, just like locking your phone in Yeolpumta.
- Three ways to fly: direct flights, pomodoro legs that hop from city to city with layovers, and open flights that run like a stopwatch.
- Land early and you touch down at the nearest airport. Your plane stays where it landed, so the next flight departs from there.
- A calm cabin or rain ambience plays while you fly.
- The logbook keeps a map of your routes and every flight you have taken.
- Yeolpumta style stats for each day, week and month, with a timeline planner, focus bars, a calendar heatmap, max focus and streaks.
- Distances in km, mi or nm and speeds in km/h, mph or kts.
- Everything stays in your browser. Export, import or erase your data from Settings. Installable as a desktop app and works offline.

## Map data
The world map is generated from Natural Earth via world-atlas. Run `node scripts/gen-world-dots.mjs` to rebuild `src/data/worldDots.ts`.
