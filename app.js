const ROLES = {
    ADMIN: "Admin",
    SUPERVISOR: "Supervisor",
    INTERN: "Intern",
    VIEWER: "Viewer"
};

const OFFICES = {
    InternOffice: {
        location: "Engineering Building",
        desks: ["D01","D02","D03","D04","D05","D06","D07","D08"]
    },

    InternOffice2: {
        location: "Engineering Building",
        desks: ["D01","D02","D03","D04"]
    },

    Remote: {
        location: "Remote",
        desks: []
    }
};

const DEPARTMENTS = [
    "Frontend Development",
    "Backend Development",
    "UI/UX Design",
    "Brand Identity",
    "Data Science and Generative AI",
    "Python Programming",
    "Product Design (Website)"
];

const NYSC = ["NA","A1","A2","B1","B2","C1","C2"];


const STORAGE_KEY = "FIORM_DATA";

const Storage = {

    load() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
};



/* =========================
   INITIAL STATE
========================= */

const defaultState = {
    interns: [],
    schedule: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: []
    },
    activityLog: [],
    departments: DEPARTMENTS,
    offices: OFFICES,
    role: "Admin"
};

/* =========================
   LOAD OR INIT STATE
========================= */

let state = Storage.load() || defaultState;

function saveState() {
    Storage.save(state);
}




/* =========================
   DOM CACHE
========================= */

const internTable = document.getElementById("internTable");
const internSearch = document.getElementById("internSearch");
const officeDepartmentSelect = document.getElementById("officeDepartment");

const totalInternsEl = document.getElementById("totalInterns");
const assignedTodayEl = document.getElementById("assignedToday");
const availableDesksEl = document.getElementById("availableDesks");
const remoteInternsEl = document.getElementById("remoteInterns");
const occupancyRateEl = document.getElementById("occupancyRate");

const weeklyOverviewEl = document.getElementById("weeklyOverview");
const recentActivityEl = document.getElementById("recentActivity");




/* =========================
   HELPERS
========================= */

function generateId(prefix) {
    return prefix + Math.floor(Math.random() * 1000000);
}

function getFullName(first, last) {
    return `${first} ${last}`.trim();
}

function findIntern(email) {
    return state.interns.find(i => i.email === email);
}





/* =========================
   ACTIVITY LOG
========================= */

function logAction(action, description, category = "System") {

    const entry = {
        id: generateId("LOG_"),
        timestamp: new Date().toISOString(),
        role: state.role,
        action,
        description,
        category
    };

    state.activityLog.unshift(entry);

    saveState();
}




/* =========================
   INTERN CREATION
========================= */

function addIntern(formData) {

    const intern = {
        id: generateId("INT_"),
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: getFullName(formData.firstName, formData.lastName),
        email: formData.email,
        phone: formData.phone,
        university: formData.university,
        course: formData.course,
        officeDepartment: formData.officeDepartment,
        nyscBatch: formData.nyscBatch,
        status: "Active",
        assignments: []
    };

    state.interns.push(intern);

    logAction(
        "Add Intern",
        `${intern.fullName} was added`,
        "Intern Management"
    );

    saveState();
    updateUI(); 

}


/* =========================
   VIEW SWITCHER
========================= */

function switchView(viewId) {

    document.querySelectorAll(".view").forEach(v => {
        v.classList.remove("active");
    });

    document.getElementById(viewId).classList.add("active");
}



/* =========================
   NAV EVENTS
========================= */

document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {

        const view = btn.dataset.view + "-view";

        switchView(view);
    });
});



/* =========================
   FORM SUBMIT
========================= */

document.getElementById("internForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        university: document.getElementById("university").value,
        course: document.getElementById("course").value,
        officeDepartment: document.getElementById("officeDepartment").value,
        nyscBatch: document.getElementById("nyscBatch").value
    };

    addIntern(formData);

    e.target.reset();
});


/* =========================
   INIT UPDATED
========================= */

function init() {

    console.log("FIORM System Initialized");

    loadDepartments();

    renderInterns();

    renderDashboard();

    renderSchedule();

    applyRoleRestrictions();

    switchView("dashboard-view");
}



/* =========================
   DEPARTMENTS INIT
========================= */

import { DEPARTMENTS } from "./constants.js";

function loadDepartments() {

    officeDepartmentSelect.innerHTML = "";

    state.departments.forEach(dep => {
        const option = document.createElement("option");
        option.value = dep;
        option.textContent = dep;
        officeDepartmentSelect.appendChild(option);
    });
}



/* =========================
   RENDER INTERN TABLE
========================= */

function renderInterns(list = state.interns) {

    if (!internTable) return;

    if (list.length === 0) {
        internTable.innerHTML = "<p>No interns found</p>";
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>University</th>
                    <th>Department</th>
                    <th>NYSC</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    list.forEach(intern => {
        html += `
            <tr>
                <td>${intern.fullName}</td>
                <td>${intern.email}</td>
                <td>${intern.phone}</td>
                <td>${intern.university}</td>
                <td>${intern.officeDepartment}</td>
                <td>${intern.nyscBatch}</td>
                <td>
                    <button class="danger" onclick="deleteIntern('${intern.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    html += "</tbody></table>";

    internTable.innerHTML = html;
}




/* =========================
   DELETE INTERN
========================= */

function deleteIntern(id) {

    const index = state.interns.findIndex(i => i.id === id);

    if (index === -1) return;

    const removed = state.interns.splice(index, 1)[0];

    logAction(
        "Delete Intern",
        `${removed.fullName} was deleted`,
        "Intern Management"
    );

    saveState();
    renderInterns();
    updateUI();
}




/* =========================
   SEARCH INTERN
========================= */

function searchInterns(query) {

    query = query.toLowerCase();

    const filtered = state.interns.filter(i => {
        return (
            i.fullName.toLowerCase().includes(query) ||
            i.email.toLowerCase().includes(query) ||
            i.phone.toLowerCase().includes(query)
        );
    });

    renderInterns(filtered);
}



/* =========================
   SEARCH INPUT EVENT
========================= */

if (internSearch) {
    internSearch.addEventListener("input", (e) => {
        searchInterns(e.target.value);
    });
}







/* =========================
   GLOBAL ACCESS (TEMPORARY)
========================= */

window.deleteIntern = deleteIntern;



/* =========================
   SCHEDULER HELPERS
========================= */

function getTodayName() {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

function isBefore11AM() {
    const now = new Date();
    return now.getHours() < 11;
}


/* =========================
   ASSIGN INTERN
========================= */

function assignInternToSchedule(internId, day, office, deskId) {

    const intern = state.interns.find(i => i.id === internId);

    if (!intern) return;

    // Prevent duplicate assignment on same day
    const alreadyAssigned = state.schedule[day].find(a => a.internId === internId);

    if (alreadyAssigned) {
        alert("Intern already assigned for this day");
        return;
    }

    // Check desk conflict
    const deskTaken = state.schedule[day].find(a => a.deskId === deskId);

    if (deskTaken && office !== "Remote") {
        alert("Desk already occupied");
        return;
    }

    const assignment = {
        id: generateId("SCH_"),
        internId,
        internName: intern.fullName,
        day,
        office,
        deskId: office === "Remote" ? null : deskId,
        status: "Active",
        timestamp: new Date().toISOString()
    };

    state.schedule[day].push(assignment);

    logAction(
        "Assign Desk",
        `${intern.fullName} assigned to ${office} ${deskId || ""} on ${day}`,
        "Scheduling"
    );

    saveState();
    updateUI();
}



/* =========================
   OPT OUT / REMOVE ASSIGNMENT
========================= */

function removeAssignment(day, internId) {

    if (!isBefore11AM()) {
        alert("Opt-out period has ended (after 11:00 AM)");
        return;
    }

    const index = state.schedule[day].findIndex(a => a.internId === internId);

    if (index === -1) return;

    const removed = state.schedule[day].splice(index, 1)[0];

    const intern = state.interns.find(i => i.id === internId);

    logAction(
        "Opt Out",
        `${intern.fullName} opted out of ${day}`,
        "Scheduling"
    );

    saveState();
    updateUI();
}


/* =========================
   AVAILABLE DESKS
========================= */

function getAvailableDesks(day, office) {

    if (office === "Remote") return [];

    const occupied = state.schedule[day]
        .filter(a => a.office === office)
        .map(a => a.deskId);

    const allDesks = state.offices[office].desks;

    return allDesks.filter(d => !occupied.includes(d));
}


/* =========================
   AUTO ASSIGN (SIMPLE)
========================= */

function autoAssign(day, office = "InternOffice") {

    const availableDesks = getAvailableDesks(day, office);

    const unassignedInterns = state.interns.filter(intern => {
        return !state.schedule[day].some(a => a.internId === intern.id);
    });

    unassignedInterns.forEach((intern, index) => {

        const deskId = office === "Remote"
            ? null
            : availableDesks[index];

        if (!deskId && office !== "Remote") return;

        assignInternToSchedule(
            intern.id,
            day,
            office,
            deskId
        );
    });
}


/* =========================
   CLEAR WEEK
========================= */

function clearWeek() {

    state.schedule = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: []
    };

    logAction(
        "Reset Schedule",
        "Weekly schedule cleared",
        "Scheduling"
    );

    saveState();
    updateUI();
}


/* =========================
   BUTTON EVENTS
========================= */

document.getElementById("autoAssignBtn").addEventListener("click", () => {
    const office = document.getElementById("officeSelector").value;
    autoAssign("Monday", office);
});

document.getElementById("clearWeekBtn").addEventListener("click", () => {
    clearWeek();
});




window.assignInternToSchedule = assignInternToSchedule;
window.removeAssignment = removeAssignment;


/* =========================
   DASHBOARD STATS
========================= */

function calculateDashboardStats() {

    const totalInterns = state.interns.length;

    const today = getTodayName();

    const assignedToday = state.schedule[today]?.length || 0;

    const remoteInterns = state.schedule[today]
        ? state.schedule[today].filter(a => a.office === "Remote").length
        : 0;

    const totalDeskCapacity =
        state.offices.InternOffice.desks.length +
        state.offices.InternOffice2.desks.length;

    const totalAssigned = Object.values(state.schedule)
        .flat()
        .filter(a => a.office !== "Remote").length;

    const occupancyRate = totalDeskCapacity > 0
        ? Math.round((totalAssigned / (totalDeskCapacity * 5)) * 100)
        : 0;

    return {
        totalInterns,
        assignedToday,
        remoteInterns,
        occupancyRate
    };
}



/* =========================
   RENDER STATS
========================= */

function renderDashboardStats() {

    const stats = calculateDashboardStats();

    if (totalInternsEl) totalInternsEl.textContent = stats.totalInterns;
    if (assignedTodayEl) assignedTodayEl.textContent = stats.assignedToday;
    if (remoteInternsEl) remoteInternsEl.textContent = stats.remoteInterns;
    if (occupancyRateEl) occupancyRateEl.textContent = stats.occupancyRate + "%";

    const available =
        (state.offices.InternOffice.desks.length +
        state.offices.InternOffice2.desks.length) * 5
        - Object.values(state.schedule).flat().length;

    if (availableDesksEl) availableDesksEl.textContent = available;
}



/* =========================
   WEEKLY OVERVIEW
========================= */

function renderWeeklyOverview() {

    if (!weeklyOverviewEl) return;

    let html = "";

    Object.keys(state.schedule).forEach(day => {

        const count = state.schedule[day].length;

        html += `
            <div class="overview-row">
                <strong>${day}</strong>
                <span>${count} assigned</span>
            </div>
        `;
    });

    weeklyOverviewEl.innerHTML = html;
}



/* =========================
   RECENT ACTIVITY
========================= */

function renderRecentActivity() {

    if (!recentActivityEl) return;

    const recent = state.activityLog.slice(0, 5);

    if (recent.length === 0) {
        recentActivityEl.innerHTML = "<p>No recent activity</p>";
        return;
    }

    let html = "";

    recent.forEach(log => {

        html += `
            <div class="activity-item">
                <strong>${log.action}</strong>
                <p>${log.description}</p>
                <small>${new Date(log.timestamp).toLocaleString()}</small>
            </div>
        `;
    });

    recentActivityEl.innerHTML = html;
}



/* =========================
   DASHBOARD RENDER MASTER
========================= */

function renderDashboard() {
    renderDashboardStats();
    renderWeeklyOverview();
    renderRecentActivity();
}

/* =========================
   AUTO REFRESH
========================= */

function refreshUI() {

    renderDashboard();
    renderInterns();
}


/* =========================
   ROLE PERMISSIONS
========================= */

function canAssignDesk() {
    return state.role === "Admin";
}

function canManageInterns() {
    return state.role === "Admin" || state.role === "Supervisor";
}

function canExportData() {
    return state.role === "Admin" || state.role === "Supervisor";
}

function canResetSystem() {
    return state.role === "Admin";
}



/* =========================
   SET ROLE
========================= */

function setRole(role) {
    state.role = role;
    saveState();

    logAction(
        "Role Change",
        `Role changed to ${role}`,
        "System"
    );
}


/* =========================
   EXPORT BACKUP
========================= */

function exportBackup() {

    if (!canExportData()) {
        alert("You do not have permission to export data");
        return;
    }

    const backup = {
        version: "1.0.0",
        app: "FIORM",
        timestamp: new Date().toISOString(),
        data: state
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `FIORM_BACKUP_${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);

    logAction(
        "Export Backup",
        "System backup exported",
        "System"
    );
}



/* =========================
   RESTORE BACKUP
========================= */

function restoreBackup(file) {

    const reader = new FileReader();

    reader.onload = function (e) {

        try {
            const backup = JSON.parse(e.target.result);

            if (!backup.data) {
                alert("Invalid backup file");
                return;
            }

            const confirmRestore = confirm("Restore system from backup? This will overwrite current data.");

            if (!confirmRestore) return;

            state = backup.data;

            saveState();

            renderInterns();
            renderDashboard();

            logAction(
                "Restore Backup",
                "System restored from backup",
                "System"
            );

            alert("Restore successful");

        } catch (err) {
            alert("Failed to restore backup");
            console.error(err);
        }
    };

    reader.readAsText(file);
}


/* =========================
   RESTORE FILE INPUT
========================= */

const restoreInput = document.getElementById("restoreFile");

if (restoreInput) {
    restoreInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) restoreBackup(file);
    });
}




/* =========================
   RESET SYSTEM Reserved for Admin Only
========================= */

function resetSystem() {

    if (!canResetSystem()) {
        alert("Only Admin can reset system");
        return;
    }

    const confirmReset = confirm("Reset entire system? This cannot be undone.");

    if (!confirmReset) return;

    localStorage.removeItem("FIORM_DATA");

    location.reload();
}



document.getElementById("backupBtn")?.addEventListener("click", exportBackup);

document.getElementById("restoreFile")?.addEventListener("change", (e) => {
    restoreBackup(e.target.files[0]);
});

document.getElementById("resetSystemBtn")?.addEventListener("click", resetSystem);


/* =========================
   UI PERMISSION GUARD
========================= */

function applyRoleRestrictions() {

    if (!canAssignDesk()) {
        document.getElementById("schedule-view")
            ?.querySelectorAll("button")
            .forEach(btn => btn.disabled = true);
    }

    if (!canManageInterns()) {
        document.getElementById("internForm")
            ?.querySelectorAll("input, button, select")
            .forEach(el => el.disabled = true);
    }
}



/* =========================
   RENDER WEEKLY SCHEDULE
========================= */

function renderSchedule() {

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    days.forEach(day => {

        const column = document.querySelector(`.day-column[data-day="${day}"]`);

        if (!column) return;

        const assignments = state.schedule[day] || [];

        if (assignments.length === 0) {
            column.innerHTML = "<p class='text-muted'>No assignments</p>";
            return;
        }

        let html = "";

        assignments.forEach(a => {

            html += `
                <div class="schedule-card">

                    <strong>${a.internName}</strong>

                    <p>${a.office} ${a.deskId || ""}</p>

                    <small>${a.status}</small>

                    ${
                        canManageInterns()
                        ? `<button class="danger" onclick="removeAssignment('${day}', '${a.internId}')">
                                Opt Out
                           </button>`
                        : ""
                    }

                </div>
            `;
        });

        column.innerHTML = html;
    });
}


/* =========================
   SYNC UI STATE
========================= */

function syncUI() {

    renderInterns();

    renderDashboard();

    renderSchedule();
}


/* =========================
   GLOBAL UPDATE PIPELINE
========================= */

function updateUI() {
    syncUI();
}



/* =========================
   LIVE CLOCK + AUTO REFRESH
========================= */

setInterval(() => {

    const timeEl = document.getElementById("currentTime");
    const dateEl = document.getElementById("currentDate");

    const now = new Date();

    if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString();
    }

    if (dateEl) {
        dateEl.textContent = now.toDateString();
    }

}, 1000);

