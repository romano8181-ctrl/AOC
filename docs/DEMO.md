# Шпаргалка для демо · 6,5 хв

**Перед виступом:** `npm run build && npm run preview` → http://localhost:4173 · Chrome на весь екран, zoom 100–110% ·
**Reset demo data** (вгорі праворуч) · відкрита вкладка Overview · DevTools закриті.

Історія: «У Варшаві гроза — AU101 затримується, і це зачіпає рейс з Києва».

| # | Час | Де | Що робити | Що побачать |
| --- | --- | --- | --- | --- |
| 1 | 0:00 | Слайд | Вступ: навчальна симуляція оперцентру, 4 дні vibe coding | — |
| 2 | 0:40 | Слайд | Проблема: затримка → конфлікт гейтів → падіння пунктуальності | — |
| 3 | 1:20 | **Overview** | Показати KPI і Alerts | 48 рейсів · On time 39 · Delayed 7 · OTP 84,8% · алерт «LW330 — gate required» · бейдж SIMULATION MODE |
| 4 | 2:00 | **Flights** | Пошук `AU101` → Clear filters → перемикач **Delayed ≥ 15 min** | AU101 12:30, A3, Scheduled · «Showing 7 of 48» = KPI Delayed |
| 5 | 2:40 | **Simulator → Delay** | Flight **AU101**, 45 хв, Reason **Weather** — показати Impact preview — **Apply delay** | Preview: 13:15, «Will conflict with DW220», 39→38, 7→8, 84,8→82,6% · toast з кнопкою Reassign · рядок у Event log |
| 6 | 3:30 | **Overview** | Повернутись | On time 38 · Delayed 8 · Avg 39 хв · червоний алерт «Gate A3 conflict: AU101 / DW220» |
| 7 | 4:00 | **Gates** (Resolve) | У «Gate required» біля AU101 → **Reassign** | A4 вимкнено «Conflicts with AU115 12:15–13:15», B6 «Gate closed» → обрати **A5** → **Move to A5** → конфлікт зник |
| 8 | 4:50 | **Analytics** | Показати плитки й графіки | OTP 82,6% (ті самі цифри, що на Overview) · завантаженість A5 зросла · «How these numbers are calculated» |
| 9 | 5:10 | будь-де | **F5** | Усе збереглось. «А Reset повертає вихідний сценарій» (не натискати) |
| 10 | 5:30 | Слайд | Архітектура | React + TS + Zustand + Recharts, без backend · domain з чистих функцій · 164 unit-тести · стани гейтів і KPI обчислюються |
| 11 | 6:10 | Слайд | Lessons learned | спека до коду · тести як страховка від AI-регресій · жорсткий scope |

## Якщо лишився час / питають

Simulator → **Close gate** → A4 + Equipment failure: preview показує AU115, AU112, BX506 і Active gates 11→10 → Confirm → Gates → **Assign gate** для LW330 → B3.

## План B

- Локальна версія не стартує → задеплоєна версія: **https://aoc-lime.vercel.app** (перед показом натиснути Reset demo data).
- Немає мережі й не стартує → відео демо.
- Щось пішло не так посеред демо → **Reset demo data** і продовжити з кроку 3.

## Підказка щодо вибору у списках

Список рейсів у Delay відсортований за часом: AU101 — другий (після BX503). Причина Weather — перша в списку.
