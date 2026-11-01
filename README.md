# Взаємодія з архівом і пасхалки

Додано навчальне підсвічування приладів, перевірку контактного мікрофона, дослідження відкритих архівних камер із новими репліками, звукові акценти відкриття й обох фіналів. На столі — ведмедик із писком носа (FNAF) та буклет Phasmophobia.

Зміни та перевірки: [INTERACTION_POLISH.md](INTERACTION_POLISH.md). Запуск — так само через Live Server або локальний HTTP-сервер, як описано нижче.

?(# Відлуння (ECHO) — PATCH 02 + StoryFix, об'єднана вебверсія

Браузерний психологічний 3D-хорор. Цей архів об'єднує **оптимізацію,
лабораторію та інтерфейс нашого PATCH 02** з **оновленим сюжетом Романа**.

## Що нового в цьому об'єднанні

- Три справи: **017 Ірина Савчук → 018 Олена Марчук → 019 Анна Коваль**.
- Доповнені діалоги, перевірки спогадів, родинна розмова, приховані акустичні
  свідчення, архів попередніх реконструкцій і **два фінали**.
- Анна має **коротке каре**, усі жіночі реконструкції — **вужчі плечі**.
  Ми залишили власну оптимізовану скляну 3D-модель, матеріали та освітлення.
- У вступі натисніть **«ОПЕРАТОР / 071»** внизу праворуч, якщо потрібно
  обрати справи, порядок їх проходження чи вимкнути додаткову родинну сцену.
- Збережені наші режими **«ГРАФІКА · БАЛАНС» / «ШВИДКІСТЬ»**, програмний
  резервний рендерер, меню, документи та адаптивний інтерфейс.

**Важливо:** справу 019 рекомендуємо залишати останньою: її вибір завершує
нічну зміну. Старі примітки PATCH 01/02 нижче описують попередні етапи;
в актуальній об'єднаній версії сюжет уже оновлено.

Повний список змін — у `MERGE_CHANGELOG.md`, результати перевірок — у
`MERGE_TEST_REPORT.md`.

## Як запустити

1. Розпакуйте ZIP повністю, разом із папкою `vendor`.
2. Відкрийте папку у VS Code та запустіть `index.html` через **Live Server**.
   Альтернатива: запустіть локальний HTTP-сервер у цій папці.
3. Відкрийте гру в сучасному Chrome, Edge або Firefox із увімкненим апаратним прискоренням.

Не варто просто відкривати `index.html` через `file://`: браузер може заблокувати імпорт JavaScript-модулів.

## Якщо гра лагає

- Натисніть угорі **«ГРАФІКА · БАЛАНС»** — перемкнеться режим **«ГРАФІКА · ШВИДКІСТЬ»** із меншою роздільністю 3D.
- Якщо показано **«ГРАФІКА · CPU»**, WebGL недоступний: перевірте апаратне прискорення браузера та драйвер відеокарти.
- На презентації закрийте непотрібні вкладки браузера й не запускайте відео на фоні.

## Що змінено

- Знижено кількість окремих викликів рендерингу: незмінні 3D-панелі згруповані в `InstancedMesh`.
- Прибрано дорогі динамічні тіні від сотень деталей; додано легку м'яку тінь під відлуннями.
- Прибрано додатковий проход рендерингу від фізичної прозорості скляних фігур.
- Обмежено роздільність 3D з урахуванням розміру екрана; додано ручний швидкісний режим.
- Екран монітора оновлюється приблизно 15 разів/с, а не кожного кадру.
- Трохи покращено читабельність текстів, кнопок і анімацію стартового екрана.
- Запасний програмний рендерер малює в меншій роздільності.
- Виправлено зависання діалогів на переходах між сценами та уточнено підказки інтеркому.

## Швидка перевірка перед показом

1. «Почати нічну зміну» → досьє **017** → інтерком → підтвердити згадку про озеро.
2. Досьє **018** → інтерком → підтвердити Марту й «ластівку» → дослідити невідповідність.
3. Дійти до справи **019**, прослухати Анну, відкрити архівні камери й обрати фінал.
4. Перевірити звук і плавність на **тому самому ноутбуці й у тому самому браузері**, де відбудеться презентація.

Управління: затиснути мишу — озирнутися; `1`–`4` — інструменти; `D` — досьє;
`E` — інтерком; `J` — протокол; `Space` / `Enter` — далі;
`R` — повторити репліку; `Esc` — закрити документ.

Це оптимізація за аналізом коду, а не виміряний FPS-тест на вашому обладнанні.


## Patch 01 — Cinematic & Visual Overhaul

This archive includes the complete game with a redesigned human hologram, cinematic lighting and materials, additional laboratory equipment, polished gameplay HUD and extended static batching. Story, dialogue, choices and ending conditions are preserved.

Extract the ZIP, open the directory containing `index.html`, and run:

```text
py -m http.server 8000
```

Then open `http://localhost:8000`. On systems using `python` instead of `py`, use `python -m http.server 8000`. No package installation, build step or internet connection is needed for the game files.

See [PATCH_01_CHANGELOG.md](PATCH_01_CHANGELOG.md) and [PATCH_01_TEST_REPORT.md](PATCH_01_TEST_REPORT.md) for changes, actual checks and hardware/browser validation limits.

The supplied Three.js version and license remain in `vendor/`. The new human body is local geometry in `art/human-body.js`; no model loader is required. The final intro, dossier, protocol and ending redesigns are included in Patch 02 below.


## Patch 02 — Final Cinematic Polish

This complete archive includes the final opening, dossier, protocol and ending interfaces, responsive/keyboard refinements and a restrained frosted-glass character material. The complete `game.js` remains byte-for-byte identical to Patch 01. Local dependencies, adaptive Speed rendering and the software fallback are retained.

Extract all files, run `py -m http.server 8000` in the directory containing `index.html`, and open `http://localhost:8000`. No build or package installation is required. After starting the shift, select **ГРАФІКА · ШВИДКІСТЬ** for the presentation.

- [PATCH_02_CHANGELOG.md](PATCH_02_CHANGELOG.md) — exact scope and preserved files.
- [PATCH_02_TEST_REPORT.md](PATCH_02_TEST_REPORT.md) — executed tests, measured renderer counts and environment limits.
- [DEMO_GUIDE.md](DEMO_GUIDE.md) — English presentation walkthrough and launch/audio/fallback help.
- [PATCH_02_MERGE_NOTES.md](PATCH_02_MERGE_NOTES.md) — boundaries for a later comparison with the teammate's version.
