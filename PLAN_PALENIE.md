# Plan: papierosy w projekcie 30

**Status:** roboczy, do iteracji  
**Data:** 2026-05-18  
**Cel:** z paczki dziennie (~20) → palaczka okazjonalna (imprezy, wyjątki)  
**Horyzont:** ~10 miesięcy (do końca projektu, kwiecień 2027), ale bez sztywnej daty "ostatniego papierosa"

---

## 1. Filozofia (to jest ważne, przeczytaj zanim zaczniesz kodować)

Nie projektujemy aplikacji "rzucania palenia". Projektujemy aplikację **przesuwania papierosa z roli codziennego mechanizmu w rolę rzadkiego, świadomego wyboru**.

To inne narzędzie poznawcze niż klasyczne "quit smoking apps". Tamte budują tożsamość "jestem niepaląca/y" i każdy papieros to relapse. Nasze podejście buduje tożsamość "to nie jest moja codzienność" i każdy papieros jest danymi, nie porażką.

**Konsekwencje projektowe:**

- Nie ma streaku "X dni bez papierosa". Streak w projekcie 30 jest święty i dotyczy logowania, nie palenia.
- Nie ma czerwonych alertów, "ostrzeżeń", emoji pożaru. Aplikacja liczy spokojnie, jak licznik kilometrów.
- Drzewo w /progress rośnie niezależnie od palenia. Możesz palić paczkę i drzewo rośnie, bo dbasz o resztę. Drzewo to ty jako człowiek, nie ty jako "niepaląca".
- Heatmapy w /timeline dostają nową warstwę. Tu jest cała magia: wzorce palenia są tym co projekt 30 już umie pokazywać najlepiej.

**Uczciwa pułapka której musisz być świadoma:**

"Palaczka okazjonalna" to klasyczna ścieżka powrotu do nawyku. Statystycznie znaczna część osób które mówią "tylko na imprezach" wraca do paczki dziennie w ciągu 12-18 miesięcy. Mechanizm: 1/tydzień → 2/tydzień → "ten tydzień jest stresujący, palę 3" → masz znowu paczkę dziennie i nie zauważyłaś kiedy.

Aplikacja musi mieć **rolling 30-day average alarm** który mówi cicho: "twoja średnia w ostatnich 30 dniach rośnie trzeci tydzień z rzędu, sprawdź kontekst". To nie ma karać, ma być spokojnym lustrem.

---

## 2. Plan w pięciu fazach (proponowany, do negocjacji)

### FAZA 1 — Obserwacja (maj-czerwiec 2026, ~6 tygodni)

**Cel:** wiedzieć ile naprawdę palisz. Nic więcej.

- Tylko licznik +1 przy każdym papierosie
- Opcjonalnie kontekst: po kawie / po posiłku / po queście / stres / nuda / impreza / wieczór z kimś
- Brak limitu, brak presji, brak XP za "mniej"
- Achievementy: "Pierwszy dzień świadomy", "Tydzień obserwacji" (po prostu za logowanie, nie za ilość)

**Po co:** prawie na pewno palisz więcej (lub mniej) niż myślisz. Ludzie systematycznie zaniżają liczbę o ~20-30%. Dane bazowe są walutą całego planu.

### FAZA 2 — Dywersyfikacja (lipiec-wrzesień 2026, ~3 miesiące)

**Cel:** rozłączyć papierosa od "nagrody za rzeczy".

- Soft target: -15-25% od bazy (jeśli baza to 20, celuj w 15-17)
- Wprowadzasz mikro-eliminacje pojedynczo, jedna na 2 tygodnie:
  - Nie palę przed śniadaniem
  - Nie palę w łóżku
  - Nie palę natychmiast po queście — najpierw 5 minut innej nagrody, potem (jeśli wciąż chcesz) palę
- Aplikacja **sugeruje** alternatywne nagrody po queście (kawa w ładnej filiżance, perfumy, jedna piosenka tylko dla siebie). Bierze z istniejącego `REDIRECT_QUESTS`, plus nowa pula małych zmysłowych mikro-nagród.

**Po co:** twoja obecna pętla to "ukończyłam rzecz → papieros = nagroda". Nie chcemy zniszczyć motywacji, chcemy poszerzyć repertuar. W tej fazie papieros zostaje w grze, ale przestaje być jedyną kartą.

### FAZA 3 — Kompresja (październik-grudzień 2026, ~3 miesiące)

**Cel:** zmniejszyć kontekst, nie tylko liczbę.

- Soft target: 8-12/dzień
- Główna zmiana: **papieros tylko na zewnątrz**. Nie w domu, nie w samochodzie z otwartym oknem, nie na balkonie z fotela. Zewnątrz w pełni: kurtka, buty, świadoma decyzja.
- Pierwsze "puste dni" się pojawiają same, bo padał deszcz albo było ci po prostu lżej
- Święta są **buforem**, nie celem. Jeśli 24-26 grudnia palisz więcej, to OK. Aplikacja odznacza to jako "okres świąteczny" i nie liczy do trendu.

**Po co:** odebranie kontekstów (w domu = wygoda, samochód = nuda) załatwia więcej niż liczbowy cel. To metoda kontekstowa Wendy Wood, ma silne dowody.

### FAZA 4 — Transfer (styczeń-luty 2027, ~2 miesiące)

**Cel:** "domyślnie nie palę" jako nowa norma.

- Soft target: 3-5/dzień, ale większość dni 0
- Papierosy tylko w bardzo konkretnych warunkach (wino z przyjaciółką, piątek wieczór, balkon u kogoś)
- Tu Smoke Protocol działa najczęściej — patrz sekcja 3.

**Po co:** to jest najtrudniejsza faza w trakcie. Tu zaczyna się "głód jako emocja, nie jako uzależnienie chemiczne". Ciało już ci podziękowało, ale głowa pamięta.

### FAZA 5 — Okazjonalnie (marzec-kwiecień 2027 i dalej)

**Cel:** "to nie jest moja codzienność".

- Domyślnie 0
- Okazje: imprezy, wyjątkowe wieczory, wybór z radością nie z głodem
- Licznik wciąż działa, ale jako raport historyczny, nie kontrolny
- **Rolling 30-day average alarm aktywny.** Jeśli średnia rośnie 3 tygodnie z rzędu, dostajesz spokojny ping: "sprawdź kontekst".

**Po co:** to jest faza dożywotnia. Projekt 30 się kończy 5 kwietnia 2027, ale ta faza nie. Aplikacja musi to obsługiwać przez kolejne lata.

---

## 3. Architektura techniczna (gdzie się wpina w istniejący kod)

### 3.1. DailyLog (lib/schemas.ts + types/index.ts)

Nowe opcjonalne pole:

```ts
cigarettes?: CigaretteEntry[]

interface CigaretteEntry {
  timestamp: number
  hour: number          // 0-23, dla heatmapy godzinowej
  context?: CigaretteContext
  intensity?: 1 | 2 | 3 | 4 | 5  // jeśli używasz Smoke Protocol
}

type CigaretteContext =
  | 'kawa' | 'posilek' | 'quest' | 'stres' | 'nuda'
  | 'impreza' | 'wieczor_z_kims' | 'samochod' | 'inne'
```

Zaprojektowane jako opcjonalne, żeby nie psuć istniejących logów. Stare logi parsują się normalnie.

### 3.2. UserStats — kilka nowych pól

```ts
cigarettesBaseline?: number             // średnia z fazy 1
cigarettesPhase?: 1 | 2 | 3 | 4 | 5
cigarettesPhaseStartDate?: string
cigarettesAlarmTriggered?: string | null // ostatnia data alarmu rolling avg
```

Bez `totalCigarettes` jako licznika ogólnego — to demotywujący numer i nic dobrego nie daje.

### 3.3. Nowy komponent: `SmokeButton` (FAB lub dashboard widget)

Mały, dyskretny przycisk +1. Po kliknięciu opcjonalnie pyta o kontekst (1 tap = log bez kontekstu, long-press lub drugi tap = wybór kontekstu z 8 ikon).

Lokalizacja: ten sam pasek co `QuickActionsFab`, ale jako oddzielna ikonka. Nie chowamy go za 3 klikami, bo wtedy nie będziesz logować.

### 3.4. Nowy "Smoke Protocol" (wzorowany na GhostProtocolV2)

To jest opcjonalny przepływ "stop, czemu sięgam?" PRZED papierosem. Nie zawsze, tylko kiedy chcesz.

Wpisujesz intensity (1-5, te same labels co Ghost Protocol działają: Pyknięcie / Chmurka / Fala / Tsunami / Krytycznie). Wpisujesz kategorię (te same które mam dla papierosa: kawa, stres, nuda, etc.).

Aplikacja proponuje alternatywę:
- intensity 1-2 → 5 minut przerwy + redirect quest (woda, perfumy, piosenka)
- intensity 3 → konkretny redirect quest z istniejącej puli REDIRECT_QUESTS
- intensity 4-5 → "OK, zapal, ale zaloguj kontekst. To nie porażka."

Smoke Protocol nigdy nie zatrzymuje cię siłą. To narzędzie świadomości, nie blokada.

### 3.5. Heatmapy (w /timeline, w istniejącym `_tabs`)

Nowa zakładka: **"Oddech"** lub **"Wzorce"**.

Trzy panele:
1. **Heatmapa godzinowa** (24 × dni tygodnia, jak GitHub): kiedy najczęściej palisz. Pewnie zobaczysz pas 8-10 rano (kawa) i 18-22 (wieczór). To są twoje najbardziej "wzorcowe" pasy do atakowania w fazie 2-3.
2. **Trend tygodniowy** (sparkline + średnia 7-dniowa): linia idzie w dół, nawet jeśli pojedyncze dni skaczą. To kluczowe — patrz na trend, nie na dzień.
3. **Kontekst pie chart**: po czym najczęściej palisz. Jeśli 40% to "kawa", to atakujesz tylko kawę przez 2 tygodnie i masz natychmiastowy wynik.

Te heatmapy są w stylu istniejących heatmap w timeline — nie psujesz pattern, dodajesz nową zakładkę. To zgodne z twoją preferencją "pattern heatmaps są moją ulubioną częścią".

### 3.6. Pieniądze (mały widget na dashboardzie albo w filaru kariera)

Założenie: paczka ~17zł, 20 papierosów = ~0.85zł za sztukę.

Widget liczy:
- **Tyle zaoszczędziłaś od początku fazy 2** w stosunku do bazy z fazy 1
- Aktualizuje się co dzień

Po 3 miesiącach fazy 3 będziesz na ~1500-2500zł zaoszczędzonego. To jest namacalne, dotykalne. **Sugestia: zarezerwuj te pieniądze na konkretną rzecz** (np. WSET, side quest sq_life_19 który już jest w projekcie i kosztuje 600 XP). Aplikacja może powiązać "zaoszczędzone na paleniu" z konkretnym side questem jako jego budżet.

### 3.7. Vault — listy do siebie z faz

Wykorzystaj istniejące `VaultEntry` z typem `date`. Napisz listy do siebie w przyszłości:

- **Po fazie 1 (czerwiec):** "Co zobaczyłam w danych. Czego nie wiedziałam o sobie." Otwiera się gdy zaczyna się faza 2.
- **Po fazie 2 (wrzesień):** "Co działało, co nie. Czy jestem gotowa na fazę 3."
- **Po fazie 5 (kwiecień 2027):** "Pierwszy miesiąc okazjonalności. Czy to nadal moje?"
- **List awaryjny (typ `crisis`):** "Do siebie, jeśli wracam do paczki dziennie." Surfacuje się gdy 30-day average wróci powyżej 15. To brutalna szczerość do siebie z dzisiaj.

### 3.8. Achievementy (nie agresywne, nie codzienne)

Propozycje, każdy +200-500 XP, do filaru `cialo` lub `pozycja`:

- **Obserwowaczka** — 7 dni logowania papierosów. Po prostu logowałaś. To wszystko.
- **Mapa palenia** — pełny tydzień z kontekstem (nie tylko +1, ale też co/po czym). Odblokowuje pierwszy raport wzorców.
- **Pierwsza eliminacja** — 14 dni z rzędu bez papierosa w jednym kontekście (np. bez papierosa przed śniadaniem).
- **Trzy zera** — 3 dni z 0 papierosów w fazie 3. Niekoniecznie z rzędu.
- **Pierwszy tydzień bez codzienności** — 7 dni z średnią ≤ 2 papierosy/dzień.
- **Świadoma okazja** — pierwsza impreza w fazie 5 gdzie zalogowałaś papierosy z kontekstem "impreza" i wróciłaś do 0 następnego dnia.

Achievementy nigdy nie nagradzają "nie palenia w ogóle" jako binarnego stanu. Nagradzają **wzorzec, świadomość, decyzję**.

### 3.9. Settings — opcja wyłączenia

W `/settings` dodaj toggle: `smokingTracking: boolean`. Domyślnie `true` po setupie. Jeśli wyłączysz, znika SmokeButton, znika zakładka Oddech, znika widget. Logi historyczne zostają, ale UI nie krzyczy.

To ważne, bo w trudne tygodnie (terapia, okres, kryzys) możesz nie chcieć tego widzieć. Brak wstydu.

---

## 4. Reward loop: co zrobić z "palę po zrobionych rzeczach"

To jest sedno twojego pytania. Najlepsza odpowiedź to **trzy fazy ekspozycji**, nie jedna decyzja.

**Faza 1 (obserwacja):** zostaw wzór nietknięty. Pal po queście jeśli tak robisz. Loguj kontekst "po queście". Po 6 tygodniach zobaczysz w danych ile twoich papierosów ma kontekst "quest". Może to jest tylko 3-4 dziennie z 20, a reszta to kawa, stres, nuda. To radykalnie zmieni co atakować pierwsze.

**Faza 2 (dywersyfikacja):** po queście **15-minutowy delay**. Aplikacja po ukończeniu questa daje mikro-nagrodę (perfumy, ulubiona piosenka, kawa, 1 strona książki). Po 15 minutach pojawia się ping: "wciąż chcesz papierosa?". Jeśli tak, palisz. Jeśli nie, dostajesz 30 XP i zapisuje się jako "świadoma odmowa" (do statystyk, nie do streaku).

**Faza 3 (transfer):** quest = inna nagroda. Papieros wraca do bardzo konkretnych okazji (wieczór, towarzyski kontekst). Aplikacja przestaje sugerować papierosa jako opcję nagrody. Mikro-nagrody stają się normą.

**Skeptycznie:** mogę powiedzieć "łatwizna, podmień nawyk", ale nie podmienisz mózgu w tydzień. Pierwsze 2-3 razy gdy odmówisz papierosa po queście będzie bolało. To nie jest brak silnej woli, to neurobiologia. Aplikacja musi to wytrzymać i nie panikować.

---

## 5. Co NIE robić (przeczytaj uważnie)

- **NIE robić papierosa "wrogiem".** Nie czerwone kolory, nie smutne emotki, nie "skuś mnie nie!". To podejście rosyjskiej babci, nie projektu 30. Twoja estetyka jest spokojna i godna. Trzymaj się tego.
- **NIE łączyć palenia ze streakem logowania.** Streak jest święty. Nawet w dzień gdy zapaliłaś 30 papierosów, jeśli zalogowałaś dzień, streak rośnie. To jest absolutnie kluczowe — inaczej w gorszy dzień przestaniesz logować i zniknie cały feedback loop.
- **NIE psuć drzewa w /progress.** Drzewo nie spowalnia za palenie. Drzewo to ty jako kompletny człowiek, nie jako "niepaląca".
- **NIE robić publicznego porównywania.** Nawet jeśli aplikacja jest tylko twoja, nie projektuj UI w stylu "0 dni bez papierosa" w wielkim banerze. To mentalność "Anonimowych Palaczy", a my robimy coś innego.
- **NIE dodawać palenia do magnetism breakdown.** Magnetism breakdown to twoja codzienna obecność. Palenie nie powinno tej obecności blokować. Co najwyżej osobny licznik "Spokój ciała" gdzieś indziej.

---

## 6. Pierwszy konkretny krok (na ten tydzień)

1. **Faza 1 startuje dziś (18.05.2026).** Nie czekaj na "od poniedziałku", to mit.
2. **Minimum implementacyjne na ten tydzień:** SmokeButton + zapis `cigarettes: timestamp[]` do DailyLog. Bez kontekstu, bez Smoke Protocol, bez UI heatmapy. Tylko +1 i zliczanie.
3. **Po 6 tygodniach** (ok. 30 czerwca 2026): pierwszy raport bazowy. Wtedy decyzja o reszcie.

Reszta architektury w sekcjach 3.3-3.9 to plan na lipiec-grudzień. Nie wszystko naraz.

---

## 7. Otwarte pytania (do przemyślenia)

- Czy chcesz dodatkową prywatność (PIN przed sekcją Oddech)? Czyli żeby przypadkowo nie pokazać komuś heatmapy palenia.
- Czy "kontekst impreza" zalicza się do trendu czy jest wyłączony? Bo jeśli imprezujesz raz na 2 tygodnie po 10 papierosów, to "1 papieros dziennie" w średniej tygodniowej, mimo że codziennie palisz 0.
- Czy chcesz powiązać to z cyklem (lib/cycle-data.ts już istnieje)? Niektóre kobiety palą więcej w fazie lutealnej. Heatmapa cykl × palenie może być przydatna.
- Czy mam zaprojektować plik `lib/smoke-data.ts` analogiczny do `ghost-data.ts` z konkretnymi interwencjami per kategoria? Kategorie: kawa, posilek, quest, stres, nuda, impreza, wieczor_z_kims, samochod.

---

**Następny krok ode mnie:** jeśli zaakceptujesz tę filozofię i fazy, mogę zacząć od minimum implementacyjnego (sekcja 6.2). To 1-2 godziny pracy. Reszta to mapa drogowa na pół roku.
