document.addEventListener("DOMContentLoaded", async function () {

    const token = sessionStorage.getItem("schoolControlToken");

    const message = document.getElementById("dashboard-message");
    const userEmail = document.getElementById("user-email");
    const welcomeName = document.getElementById("welcome-name");
    const currentDate = document.getElementById("current-date");
    const logoutButton = document.getElementById("logout-button");
    const classesList = document.getElementById("classes-list");

    const totalStudents = document.getElementById("total-students");
    const totalTeachers = document.getElementById("total-teachers");
    const totalClasses = document.getElementById("total-classes");
    const totalSubjects = document.getElementById("total-subjects");

    const gradesChart = document.getElementById("grades-chart");
    const attendanceChart = document.getElementById("attendance-chart");

    const extraStyles = document.createElement("style");

    extraStyles.textContent = `
        #school-calendar {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: stretch;
            width: 100%;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
        }

        .school-calendar-widget {
            display: grid;
            grid-template-rows: 20px 15px minmax(0, 1fr);
            gap: 2px;
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
        }

        .school-calendar-navigation {
            display: grid;
            grid-template-columns: 26px minmax(0, 1fr) 26px;
            align-items: center;
            width: 100%;
            height: 20px;
        }

        .school-calendar-month {
            text-align: center;
            font-size: 12px;
            font-weight: 800;
            color: #281951;
            text-transform: capitalize;
            white-space: nowrap;
        }

        .school-calendar-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 25px;
            height: 20px;
            padding: 0;
            border: none;
            border-radius: 7px;
            background: transparent;
            color: #6b2fc6;
            font-size: 22px;
            font-weight: 700;
            line-height: 1;
            cursor: pointer;
        }

        .school-calendar-arrow:hover {
            background: #ebdeff;
        }

        .school-calendar-weekdays {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            align-items: center;
            height: 15px;
        }

        .school-calendar-weekday {
            text-align: center;
            color: #75658f;
            font-size: 10px;
            font-weight: 750;
        }

        .school-calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            width: 100%;
            height: 100%;
            min-height: 0;
            overflow: hidden;
        }

        .school-calendar-date {
            display: flex;
            align-items: center;
            justify-content: center;
            justify-self: center;
            align-self: center;
            width: 22px;
            max-width: 100%;
            height: 17px;
            max-height: 100%;
            border-radius: 50%;
            color: #302452;
            font-size: 10px;
            font-weight: 650;
            line-height: 1;
        }

        .school-calendar-date.is-saturday,
        .school-calendar-date.is-sunday {
            color: #a05ac0;
        }

        .school-calendar-date.is-today {
            color: white;
            background: linear-gradient(135deg, #a34cf0, #6925c8);
            box-shadow: 0 2px 6px rgba(111, 48, 199, 0.23);
            font-weight: 800;
        }

        .school-calendar-date.is-today.is-saturday,
        .school-calendar-date.is-today.is-sunday {
            color: white;
        }

        .school-calendar-empty {
            display: block;
            width: 100%;
            height: 100%;
        }

        .grades-visual {
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
        }

        .grades-visual-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            color: #776794;
            font-size: 10px;
            font-weight: 600;
        }

        .grades-visual-header strong {
            color: #6f2acc;
            font-size: 12px;
        }

        .grades-svg {
            display: block;
            width: 100%;
            height: 100%;
            min-height: 0;
            flex: 1;
            overflow: visible;
        }

        .attendance-visual {
            display: flex;
            align-items: center;
            justify-content: space-evenly;
            gap: 12px;
            width: 100%;
            height: 100%;
            min-width: 0;
            min-height: 0;
        }

        .attendance-donut {
            position: relative;
            display: grid;
            place-items: center;
            width: clamp(80px, 9vw, 116px);
            height: clamp(80px, 9vw, 116px);
            flex-shrink: 0;
            border-radius: 50%;
        }

        .attendance-donut-center {
            position: absolute;
            inset: 17%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #fbf8ff;
            color: #25194d;
        }

        .attendance-donut-center strong {
            font-size: 23px;
            font-weight: 850;
            line-height: 1.1;
        }

        .attendance-donut-center span {
            margin-top: 3px;
            font-size: 9px;
            color: #776794;
        }

        .attendance-legend {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 12px;
            min-width: 0;
        }

        .attendance-legend-row {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 11px;
            color: #40335f;
        }

        .attendance-legend-dot {
            width: 10px;
            height: 10px;
            flex-shrink: 0;
            border-radius: 50%;
        }

        .attendance-legend-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .attendance-legend-text strong {
            color: #26194d;
            font-size: 12px;
        }

        .chart-empty-message {
            display: grid;
            place-items: center;
            width: 100%;
            height: 100%;
            padding: 12px;
            color: #81749b;
            text-align: center;
            font-size: 12px;
            line-height: 1.5;
        }

        @media (max-width: 1190px) {
            .attendance-visual {
                gap: 5px;
            }

            .attendance-donut {
                width: 80px;
                height: 80px;
            }

            .attendance-donut-center strong {
                font-size: 18px;
            }

            .attendance-legend-row {
                font-size: 10px;
            }
        }
    `;

    document.head.appendChild(extraStyles);

    function showMessage(text, isError = false) {
        message.textContent = text;
        message.style.color = isError ? "#b42336" : "#74668f";
    }

    function clearSession() {
        sessionStorage.removeItem("schoolControlToken");
        sessionStorage.removeItem("schoolControlRole");
        sessionStorage.removeItem("schoolControlEmail");
    }

    function logout() {
        clearSession();
        window.location.replace("/login/");
    }

    logoutButton.addEventListener("click", logout);

    currentDate.textContent = new Date().toLocaleDateString("sq-AL", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    if (!token) {
        window.location.replace("/login/");
        return;
    }

    function initializeCalendar() {

        const calendarContainer = document.getElementById("school-calendar");

        if (!calendarContainer) {
            return;
        }

        const today = new Date();

        let displayedYear = today.getFullYear();
        let displayedMonth = today.getMonth();

        const widget = document.createElement("div");
        widget.className = "school-calendar-widget";

        const navigation = document.createElement("div");
        navigation.className = "school-calendar-navigation";

        const previousButton = document.createElement("button");
        previousButton.type = "button";
        previousButton.className = "school-calendar-arrow";
        previousButton.textContent = "‹";
        previousButton.setAttribute("aria-label", "Muaji i kaluar");

        const monthTitle = document.createElement("span");
        monthTitle.className = "school-calendar-month";

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.className = "school-calendar-arrow";
        nextButton.textContent = "›";
        nextButton.setAttribute("aria-label", "Muaji i ardhshëm");

        navigation.appendChild(previousButton);
        navigation.appendChild(monthTitle);
        navigation.appendChild(nextButton);

        const weekdays = document.createElement("div");
        weekdays.className = "school-calendar-weekdays";

        [
            "Hën",
            "Mar",
            "Mër",
            "Enj",
            "Pre",
            "Sht",
            "Die"
        ].forEach(function (name) {

            const element = document.createElement("span");
            element.className = "school-calendar-weekday";
            element.textContent = name;

            weekdays.appendChild(element);
        });

        const daysGrid = document.createElement("div");
        daysGrid.className = "school-calendar-grid";

        widget.appendChild(navigation);
        widget.appendChild(weekdays);
        widget.appendChild(daysGrid);

        calendarContainer.replaceChildren(widget);

        function renderCalendar() {

            const firstDay = new Date(
                displayedYear,
                displayedMonth,
                1
            );

            const daysInMonth = new Date(
                displayedYear,
                displayedMonth + 1,
                0
            ).getDate();

            const startingPosition = (firstDay.getDay() + 6) % 7;

            const requiredRows = Math.ceil(
                (startingPosition + daysInMonth) / 7
            );

            monthTitle.textContent = firstDay.toLocaleDateString(
                "sq-AL",
                {
                    month: "long",
                    year: "numeric"
                }
            );

            daysGrid.replaceChildren();

            daysGrid.style.gridTemplateRows =
                `repeat(${requiredRows}, minmax(0, 1fr))`;

            const totalCells = requiredRows * 7;

            for (let position = 0; position < totalCells; position++) {

                const dayNumber = position - startingPosition + 1;

                if (dayNumber < 1 || dayNumber > daysInMonth) {

                    const emptyCell = document.createElement("span");
                    emptyCell.className = "school-calendar-empty";
                    emptyCell.setAttribute("aria-hidden", "true");

                    daysGrid.appendChild(emptyCell);
                    continue;
                }

                const dayElement = document.createElement("span");
                dayElement.className = "school-calendar-date";
                dayElement.textContent = dayNumber;

                const date = new Date(
                    displayedYear,
                    displayedMonth,
                    dayNumber
                );

                dayElement.setAttribute(
                    "aria-label",
                    date.toLocaleDateString("sq-AL", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    })
                );

                const isToday =
                    dayNumber === today.getDate() &&
                    displayedMonth === today.getMonth() &&
                    displayedYear === today.getFullYear();

                if (isToday) {
                    dayElement.classList.add("is-today");
                    dayElement.setAttribute("aria-current", "date");
                }

                if (position % 7 === 5) {
                    dayElement.classList.add("is-saturday");
                }

                if (position % 7 === 6) {
                    dayElement.classList.add("is-sunday");
                }

                daysGrid.appendChild(dayElement);
            }
        }

        previousButton.addEventListener("click", function () {

            const date = new Date(
                displayedYear,
                displayedMonth - 1,
                1
            );

            displayedYear = date.getFullYear();
            displayedMonth = date.getMonth();

            renderCalendar();
        });

        nextButton.addEventListener("click", function () {

            const date = new Date(
                displayedYear,
                displayedMonth + 1,
                1
            );

            displayedYear = date.getFullYear();
            displayedMonth = date.getMonth();

            renderCalendar();
        });

        renderCalendar();
    }

    initializeCalendar();

    async function getData(url) {

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": "Token " + token,
                "Accept": "application/json"
            }
        });

        if (response.status === 401) {
            clearSession();
            window.location.replace("/login/");
            throw new Error("Sesioni ka përfunduar.");
        }

        if (response.status === 403) {
            throw new Error("Nuk keni leje për këtë veprim.");
        }

        if (!response.ok) {
            throw new Error("Gabim gjatë marrjes së të dhënave.");
        }

        return await response.json();
    }

    function getList(data) {

        if (Array.isArray(data)) {
            return data;
        }

        if (data && Array.isArray(data.results)) {
            return data.results;
        }

        throw new Error("Formati i listës nuk është i saktë.");
    }

    function showNumber(element, value) {

        if (Number.isInteger(value) && value >= 0) {
            element.textContent = value;
        } else {
            element.textContent = "—";
        }
    }

    async function loadProfile() {

        const profile = await getData("/api/me/");

        if (profile.roli !== "drejtor") {
            showMessage(
                "Ky panel është i disponueshëm vetëm për drejtorin.",
                true
            );

            return false;
        }

        const fullName = [
            profile.emri,
            profile.mbiemri
        ].filter(Boolean).join(" ");

        welcomeName.textContent = fullName
            ? fullName + "!"
            : "Drejtor!";

        userEmail.textContent = profile.email || "";

        return true;
    }

    async function loadStatistics() {

        const data = await getData("/api/statistikat/");

        showNumber(totalStudents, data.numri_nxenesve);
        showNumber(totalTeachers, data.numri_mesimdhenesve);
        showNumber(totalClasses, data.numri_klasave);
    }

    async function loadSubjects() {

        const data = await getData("/api/lendet/");
        const subjects = getList(data);

        showNumber(totalSubjects, subjects.length);
    }

    async function loadClasses() {

        const data = await getData("/api/klasat/");
        const classes = getList(data);

        classesList.replaceChildren();

        if (classes.length === 0) {

            const emptyMessage = document.createElement("p");
            emptyMessage.textContent =
                "Ende nuk ka klasa të regjistruara.";

            classesList.appendChild(emptyMessage);
            return;
        }

        classes.slice(0, 5).forEach(function (klasa) {

            const classItem = document.createElement("div");
            classItem.className = "class-item";

            const className = document.createElement("strong");
            const classInfo = document.createElement("span");

            const name =
                klasa.emri ||
                klasa.emertimi ||
                (klasa.id ? "Nr. " + klasa.id : "Pa emër");

            className.textContent = name;
            classInfo.textContent = "Klasa";

            classItem.appendChild(className);
            classItem.appendChild(classInfo);

            classesList.appendChild(classItem);
        });
    }

    function displayGradesChart(grades) {

        if (!gradesChart) {
            return;
        }

        const validGrades = grades.filter(function (grade) {

            const value = Number(grade.vleresimi);

            return (
                Number.isInteger(value) &&
                value >= 1 &&
                value <= 5 &&
                typeof grade.data === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(grade.data)
            );
        });

        if (validGrades.length === 0) {
            gradesChart.innerHTML =
                '<div class="chart-empty-message">Ende nuk ka nota të regjistruara për grafik.</div>';

            return;
        }

        const today = new Date();

        const currentSchoolYear =
            today.getMonth() >= 8
                ? today.getFullYear()
                : today.getFullYear() - 1;

        function getSchoolYear(dateString) {

            const year = Number(dateString.slice(0, 4));
            const month = Number(dateString.slice(5, 7));

            return month >= 9 ? year : year - 1;
        }

        const hasCurrentYearGrades = validGrades.some(function (grade) {
            return getSchoolYear(grade.data) === currentSchoolYear;
        });

        const newestGrade = validGrades.reduce(function (latest, grade) {
            return grade.data > latest.data ? grade : latest;
        });

        const schoolYear = hasCurrentYearGrades
            ? currentSchoolYear
            : getSchoolYear(newestGrade.data);

        const monthNames = [
            "Sht", "Tet", "Nën", "Dhj", "Jan",
            "Shk", "Mar", "Pri", "Maj", "Qer"
        ];

        const monthly = Array.from({ length: 10 }, function (_, index) {

            const monthIndex = (8 + index) % 12;

            const year = monthIndex >= 8
                ? schoolYear
                : schoolYear + 1;

            return {
                year: year,
                month: monthIndex + 1,
                sum: 0,
                count: 0
            };
        });

        validGrades.forEach(function (grade) {

            const year = Number(grade.data.slice(0, 4));
            const month = Number(grade.data.slice(5, 7));

            const group = monthly.find(function (item) {
                return item.year === year && item.month === month;
            });

            if (group) {
                group.sum += Number(grade.vleresimi);
                group.count += 1;
            }
        });

        const xPosition = function (index) {
            return 51 + index * 68;
        };

        const yPosition = function (average) {
            return 143 - (average - 1) * 23;
        };

        const gridLines = [1, 2, 3, 4, 5].map(function (value) {

            const y = yPosition(value);

            return `
                <line x1="45" y1="${y}" x2="667" y2="${y}"
                      stroke="#ddcff5" stroke-dasharray="4 5"/>
                <text x="29" y="${y + 4}" text-anchor="middle"
                      fill="#8d80a6" font-size="11">${value}</text>
            `;
        }).join("");

        const monthLabels = monthNames.map(function (name, index) {

            return `
                <text x="${xPosition(index)}" y="168"
                      text-anchor="middle" fill="#635582"
                      font-size="11" font-weight="600">${name}</text>
            `;
        }).join("");

        let areaPaths = "";
        let linePaths = "";
        let points = "";

        monthly.forEach(function (item, index) {

            if (!item.count) {
                return;
            }

            const average = item.sum / item.count;

            const x = xPosition(index);
            const y = yPosition(average);

            points += `
                <circle cx="${x}" cy="${y}" r="5"
                        fill="#7938e8"
                        stroke="white"
                        stroke-width="2"/>
            `;

            if (index > 0 && monthly[index - 1].count > 0) {

                const previous = monthly[index - 1];

                const previousX = xPosition(index - 1);
                const previousY = yPosition(
                    previous.sum / previous.count
                );

                areaPaths += `
                    <path d="M${previousX} 143
                             L${previousX} ${previousY}
                             L${x} ${y}
                             L${x} 143 Z"
                          fill="url(#gradesArea)"/>
                `;

                linePaths += `
                    <path d="M${previousX} ${previousY}
                             L${x} ${y}"
                          fill="none"
                          stroke="#7938e8"
                          stroke-width="3.5"
                          stroke-linecap="round"/>
                `;
            }
        });

        const gradesInYear = monthly.reduce(function (result, item) {

            result.sum += item.sum;
            result.count += item.count;

            return result;

        }, { sum: 0, count: 0 });

        if (gradesInYear.count === 0) {

            gradesChart.innerHTML =
                '<div class="chart-empty-message">Nuk ka nota për këtë vit shkollor.</div>';

            return;
        }

        const average = (
            gradesInYear.sum / gradesInYear.count
        ).toFixed(2);

        const endYear = String(schoolYear + 1).slice(-2);

        gradesChart.innerHTML = `
            <div class="grades-visual">

                <div class="grades-visual-header">
                    <span>Viti shkollor ${schoolYear}/${endYear}</span>
                    <span>Mesatarja: <strong>${average}</strong></span>
                </div>

                <svg class="grades-svg"
                     viewBox="0 0 700 177"
                     preserveAspectRatio="none"
                     role="img"
                     aria-label="Mesatarja mujore e notave të regjistruara">

                    <defs>
                        <linearGradient id="gradesArea"
                                        x1="0" y1="0"
                                        x2="0" y2="1">
                            <stop offset="0%"
                                  stop-color="#9b59f1"
                                  stop-opacity=".38"/>
                            <stop offset="100%"
                                  stop-color="#9b59f1"
                                  stop-opacity=".02"/>
                        </linearGradient>
                    </defs>

                    ${gridLines}
                    ${areaPaths}
                    ${linePaths}
                    ${points}
                    ${monthLabels}

                </svg>

            </div>
        `;
    }

    function displayAttendanceChart(absences) {

        if (!attendanceChart) {
            return;
        }

        if (absences.length === 0) {

            attendanceChart.innerHTML =
                '<div class="chart-empty-message">Ende nuk ka mungesa të regjistruara.</div>';

            return;
        }

        const hasMissingField = absences.some(function (absence) {
            return typeof absence.arsyetimi !== "string";
        });

        if (hasMissingField) {

            attendanceChart.innerHTML =
                '<div class="chart-empty-message">Të dhënat e arsyetimit nuk janë të disponueshme.</div>';

            return;
        }

        const withReason = absences.filter(function (absence) {
            return absence.arsyetimi.trim().length > 0;
        }).length;

        const withoutReason = absences.length - withReason;

        const withPercentage = Math.round(
            (withReason / absences.length) * 100
        );

        const withoutPercentage = 100 - withPercentage;

        attendanceChart.innerHTML = `
            <div class="attendance-visual">

                <div class="attendance-donut"
                     style="background: conic-gradient(
                         #7630d9 0 ${withPercentage}%,
                         #d9a3f3 ${withPercentage}% 100%
                     );">

                    <div class="attendance-donut-center">
                        <strong>${absences.length}</strong>
                        <span>Mungesa</span>
                    </div>

                </div>

                <div class="attendance-legend">

                    <div class="attendance-legend-row">

                        <span class="attendance-legend-dot"
                              style="background:#7630d9"></span>

                        <div class="attendance-legend-text">
                            <span>Me arsyetim</span>
                            <strong>${withPercentage}% (${withReason})</strong>
                        </div>

                    </div>

                    <div class="attendance-legend-row">

                        <span class="attendance-legend-dot"
                              style="background:#d9a3f3"></span>

                        <div class="attendance-legend-text">
                            <span>Pa arsyetim</span>
                            <strong>${withoutPercentage}% (${withoutReason})</strong>
                        </div>

                    </div>

                </div>

            </div>
        `;
    }

    async function loadGrades() {

        const data = await getData("/api/notat/");

        displayGradesChart(getList(data));
    }

    async function loadAbsences() {

        const data = await getData("/api/mungesat/");

        displayAttendanceChart(getList(data));
    }

    showMessage("Duke ngarkuar të dhënat...");

    try {

        const allowed = await loadProfile();

        if (!allowed) {
            return;
        }

    } catch (error) {

        showMessage(
            "Nuk mund të ngarkohet profili. " + error.message,
            true
        );

        return;
    }

    const results = await Promise.allSettled([
        loadStatistics(),
        loadSubjects(),
        loadClasses(),
        loadGrades(),
        loadAbsences()
    ]);

    const hasError = results.some(function (result) {
        return result.status === "rejected";
    });

    if (hasError) {

        showMessage(
            "Disa të dhëna nuk u ngarkuan. Rifresko faqen.",
            true
        );

    } else {

        showMessage("Të dhënat u ngarkuan me sukses.");
    }

});