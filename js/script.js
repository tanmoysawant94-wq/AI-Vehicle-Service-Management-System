// ======================================================
// AI VEHICLE SERVICE MANAGEMENT SYSTEM
// script.js
// ======================================================


// ======================================================
// PAGE LOADED
// ======================================================

let staffServiceOptions = null;
let currentStaffBookings = [];
let availableBookingGarages = [];

window.addEventListener("DOMContentLoaded", function () {

    console.log("Vehicle Service Management System Loaded Successfully");

    showCurrentDate();
    animateProgress();
    initializeServicePages();

    const pendingQuestion = sessionStorage.getItem("pendingAiQuestion");

    if (pendingQuestion) {

        sessionStorage.removeItem("pendingAiQuestion");

        const input = document.getElementById("userMessage");

        if (input) {

            input.value = pendingQuestion;
            sendMessage();

        }

    }

});

async function requestPasswordReset() {
    const email = document.getElementById("resetEmail").value.trim();
    const message = document.getElementById("forgotPasswordMessage");
    message.hidden = true;
    try {
        const result = await serviceApi("forgot-password", {
            method: "POST",
            body: JSON.stringify({ email })
        });
        showPasswordResetMessage("forgotPasswordMessage", result.message, false);
    } catch (error) {
        showPasswordResetMessage("forgotPasswordMessage", error.message, true);
    }
}

async function resetPassword() {
    const password = document.getElementById("newPassword").value;
    const confirmation = document.getElementById("confirmNewPassword").value;
    if (password !== confirmation) {
        showPasswordResetMessage("resetPasswordMessage", "The passwords do not match.", true);
        return;
    }
    try {
        const result = await serviceApi("reset-password", {
            method: "POST",
            body: JSON.stringify({
                token: document.getElementById("resetToken").value,
                password
            })
        });
        showPasswordResetMessage("resetPasswordMessage", result.message, false);
        document.getElementById("resetPasswordForm").reset();
        document.getElementById("resetToken").value = "";
        document.getElementById("resetPasswordForm").querySelector("button[type='submit']").disabled = true;
    } catch (error) {
        showPasswordResetMessage("resetPasswordMessage", error.message, true);
    }
}

function showPasswordResetMessage(id, text, isError) {
    const message = document.getElementById(id);
    message.textContent = text;
    message.className = "alert " + (isError ? "alert-danger" : "alert-success");
    message.hidden = false;
}

function serviceApiUrl(action) {
    const base = window.location.pathname.includes("/customer/") ||
        window.location.pathname.includes("/admin/")
        ? "../php/api.php"
        : "php/api.php";
    const parts = action.split("&", 2);
    return base + "?action=" + encodeURIComponent(parts[0]) +
        (parts[1] ? "&" + parts[1] : "");
}

async function serviceApi(action, options) {
    const response = await fetch(serviceApiUrl(action), {
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        ...options
    });
    let result;
    try {
        result = await response.json();
    } catch (error) {
        throw new Error("The service server returned an invalid response.");
    }
    if (!response.ok) {
        throw new Error(result.error || "The request could not be completed.");
    }
    return result;
}

function initializeServicePages() {
    const oauthError = new URLSearchParams(window.location.search).get("oauth_error");
    if (oauthError) {
        const message = document.getElementById("loginMessage");
        if (message) {
            message.textContent = oauthError;
            message.hidden = false;
        }
    }

    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        populateBookingVehicles();
        populateBookingTimeOptions();
        loadBookingGarages();
        const dateInput = document.getElementById("bookingDate");
        if (dateInput) {
            const now = new Date();
            dateInput.min = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0")
            ].join("-");
        }
        bookingForm.addEventListener("submit", function (event) {
            event.preventDefault();
            bookService();
        });
    }

    if (document.getElementById("catalogMake")) {
        initializeVehiclePartsCatalog();
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            loginUser();
        });
    }

    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", function (event) {
            event.preventDefault();
            requestPasswordReset();
        });
    }

    const resetPasswordForm = document.getElementById("resetPasswordForm");
    if (resetPasswordForm) {
        const token = new URLSearchParams(window.location.search).get("token") || "";
        document.getElementById("resetToken").value = token;
        if (!token) {
            showPasswordResetMessage("resetPasswordMessage", "This reset link is missing its token. Request a new password reset link.", true);
            resetPasswordForm.querySelector("button[type='submit']").disabled = true;
        } else {
            resetPasswordForm.addEventListener("submit", function (event) {
                event.preventDefault();
                resetPassword();
            });
        }
    }

    if (document.getElementById("bookingLookupForm")) {
        document.getElementById("bookingLookupForm").addEventListener("submit", function (event) {
            event.preventDefault();
            document.getElementById("trackingError").hidden = true;
            document.getElementById("trackingDetails").hidden = true;
            loadTrackedBooking(document.getElementById("bookingCode").value.trim());
        });
        const code = new URLSearchParams(window.location.search).get("booking");
        if (code) {
            document.getElementById("bookingCode").value = code;
            loadTrackedBooking(code);
        }
    }

    function populateBookingVehicles() {
        const select = document.getElementById("bookingVehicle");
        if (!select || typeof INDIA_VEHICLE_CATALOG === "undefined") {
            return;
        }
        select.replaceChildren();
        INDIA_VEHICLE_CATALOG.forEach(function (make) {
            const group = document.createElement("optgroup");
            group.label = make.make;
            make.models.forEach(function (model) {
                const option = document.createElement("option");
                option.value = make.make + " " + model;
                option.textContent = model;
                group.appendChild(option);
            });
            select.appendChild(group);
        });
    }

    function initializeVehiclePartsCatalog() {
        const makeSelect = document.getElementById("catalogMake");
        const modelSelect = document.getElementById("catalogModel");
        const yearSelect = document.getElementById("catalogYear");
        const partSelect = document.getElementById("catalogPart");
        const result = document.getElementById("catalogResult");
        const error = document.getElementById("catalogError");
        INDIA_VEHICLE_CATALOG.forEach(function (entry) {
            const option = document.createElement("option");
            option.value = entry.make;
            option.textContent = entry.make;
            makeSelect.appendChild(option);
        });
        const yearPlaceholder = document.createElement("option");
        yearPlaceholder.value = "";
        yearPlaceholder.textContent = "Choose year";
        yearSelect.appendChild(yearPlaceholder);
        const currentYear = new Date().getFullYear();
        for (let year = currentYear; year >= 1990; year--) {
            const option = document.createElement("option");
            option.value = String(year);
            option.textContent = String(year);
            yearSelect.appendChild(option);
        }
        VEHICLE_PART_CATALOG.forEach(function (entry) {
            const option = document.createElement("option");
            option.value = entry.name;
            option.textContent = entry.name;
            partSelect.appendChild(option);
        });
        const updateModels = function () {
            const make = INDIA_VEHICLE_CATALOG.find(function (entry) {
                return entry.make === makeSelect.value;
            });
            modelSelect.replaceChildren();
            const unspecified = document.createElement("option");
            unspecified.value = "";
            unspecified.textContent = "Choose a model (recommended)";
            modelSelect.appendChild(unspecified);
            (make ? make.models : []).forEach(function (model) {
                const option = document.createElement("option");
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        };
        makeSelect.addEventListener("change", updateModels);
        updateModels();
        const diagnosisResult = document.getElementById("diagnosisResult");
        const diagnosisError = document.getElementById("diagnosisError");
        const diagnosisImageInput = document.getElementById("diagnosisImage");
        const diagnosisImagePreviewContainer = document.getElementById("diagnosisImagePreviewContainer");
        const diagnosisImagePreview = document.getElementById("diagnosisImagePreview");
        const diagnosisVideoPreview = document.getElementById("diagnosisVideoPreview");
        const diagnosisImageStatus = document.getElementById("diagnosisImageStatus");
        let diagnosisImageUrl = "";

        const clearDiagnosisImage = function () {
            if (diagnosisImageUrl) {
                URL.revokeObjectURL(diagnosisImageUrl);
                diagnosisImageUrl = "";
            }
            diagnosisVideoPreview.pause();
            diagnosisImageInput.value = "";
            diagnosisImagePreview.removeAttribute("src");
            diagnosisVideoPreview.removeAttribute("src");
            diagnosisImagePreview.hidden = true;
            diagnosisVideoPreview.hidden = true;
            diagnosisImagePreviewContainer.hidden = true;
            diagnosisImageStatus.textContent = "";
        };

        diagnosisImageInput.addEventListener("change", function () {
            const file = diagnosisImageInput.files[0];
            diagnosisError.hidden = true;
            if (!file) {
                clearDiagnosisImage();
                return;
            }
            const isImage = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
            const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(file.type);
            const sizeLimit = isImage ? 5 * 1024 * 1024 : 25 * 1024 * 1024;
            if ((!isImage && !isVideo) || file.size > sizeLimit) {
                clearDiagnosisImage();
                diagnosisError.textContent = "Choose a JPG, PNG, or WebP photo up to 5 MB, or an MP4, WebM, or MOV video up to 25 MB.";
                diagnosisError.hidden = false;
                return;
            }
            if (diagnosisImageUrl) {
                URL.revokeObjectURL(diagnosisImageUrl);
            }
            diagnosisImageUrl = URL.createObjectURL(file);
            if (isImage) {
                diagnosisImagePreview.src = diagnosisImageUrl;
                diagnosisImagePreview.hidden = false;
                diagnosisVideoPreview.hidden = true;
                diagnosisVideoPreview.removeAttribute("src");
            } else {
                diagnosisVideoPreview.src = diagnosisImageUrl;
                diagnosisVideoPreview.hidden = false;
                diagnosisImagePreview.hidden = true;
                diagnosisImagePreview.removeAttribute("src");
                diagnosisVideoPreview.load();
            }
            diagnosisImageStatus.textContent = file.name + " — local preview only; media is not analyzed or uploaded.";
            diagnosisImagePreviewContainer.hidden = false;
        });
        document.getElementById("removeDiagnosisImage").addEventListener("click", clearDiagnosisImage);

        document.getElementById("diagnoseProblemButton").addEventListener("click", function () {
            diagnosisResult.hidden = true;
            diagnosisError.hidden = true;
            const symptoms = document.getElementById("diagnosisSymptoms").value.trim();
            if (!modelSelect.value || !yearSelect.value) {
                diagnosisError.textContent = "Select the vehicle make, model, and year before running the diagnosis.";
                diagnosisError.hidden = false;
                return;
            }
            if (symptoms.length < 8) {
                diagnosisError.textContent = "Describe the symptoms in a little more detail before running the diagnosis.";
                diagnosisError.hidden = false;
                return;
            }
            const diagnosis = diagnoseVehicleSymptoms(symptoms);
            if (!diagnosis) {
                diagnosisError.textContent = "I could not match those symptoms to a supported prediction. Try describing overheating, coolant leaks, engine noise, low mileage, brake noise, or starting problems.";
                diagnosisError.hidden = false;
                return;
            }
            document.getElementById("diagnosisVehicle").textContent =
                makeSelect.value + " " + modelSelect.value + " (" + yearSelect.value + ")";
            document.getElementById("diagnosisIssue").textContent = diagnosis.issue;
            document.getElementById("diagnosisConfidence").textContent =
                diagnosis.confidence + "% (indicative)";
            document.getElementById("diagnosisAction").textContent = diagnosis.action;
            diagnosisResult.hidden = false;
        });
        document.getElementById("catalogForm").addEventListener("submit", function (event) {
            event.preventDefault();
            error.hidden = true;
            result.hidden = true;
            const vehicle = modelSelect.value
                ? makeSelect.value + " " + modelSelect.value
                : makeSelect.value;
            const match = findIndiaVehiclePart(vehicle + " " + partSelect.value);
            if (!match) {
                error.textContent = "No estimate found for that selection. Try another vehicle and part.";
                error.hidden = false;
                return;
            }
            const estimate = calculateIndiaRepairEstimate(match.part, match.vehicle.segment);
            document.getElementById("catalogResultTitle").textContent =
                vehicle + " (" + yearSelect.value + ") — " + match.part.name;
            document.getElementById("catalogResultParts").textContent = formatIndiaRupeeRange(estimate.parts);
            document.getElementById("catalogResultLabour").textContent = formatIndiaRupeeRange(estimate.labour);
            document.getElementById("catalogResultOther").textContent = formatIndiaRupeeRange(estimate.other);
            document.getElementById("catalogResultTotal").textContent = formatIndiaRupeeRange(estimate.total);
            document.getElementById("catalogResultTime").textContent =
                match.part.minutes[0] + "–" + match.part.minutes[1] + " minutes";
            result.hidden = false;
        });
    }

    if (document.getElementById("dashboardBookings")) {
        loadCustomerDashboard();
        document.getElementById("paymentMethodUpi").addEventListener("click", function () {
            setPaymentMethod("upi");
        });
        document.getElementById("paymentMethodCard").addEventListener("click", function () {
            setPaymentMethod("card");
        });
    }

    if (document.getElementById("serviceDeskBookings")) {
        loadServiceDesk();
        document.getElementById("serviceUpdateForm").addEventListener("submit", saveServiceUpdate);
        document.getElementById("serviceDeskBookings").addEventListener("change", loadSelectedServiceBooking);
        document.getElementById("assignmentGarage").addEventListener("change", populateAssignmentMechanics);
        document.getElementById("bookingAssignmentForm").addEventListener("submit", saveBookingAssignment);
        document.getElementById("inventoryUseForm").addEventListener("submit", recordInventoryUse);
    }

    if (document.getElementById("managementPage")) {
        initializeManagementPage();
    }
}

function initializeManagementPage() {
    document.getElementById("garageForm").addEventListener("submit", saveGarage);
    document.getElementById("mechanicForm").addEventListener("submit", saveMechanic);
    document.getElementById("inventoryForm").addEventListener("submit", saveInventoryItem);
    loadManagementData();
}

async function loadManagementData() {
    try {
        const session = await serviceApi("session");
        if (!session.authenticated || session.role !== "admin") {
            window.location.href = "../login.html";
            return;
        }
        const data = await serviceApi("management-data");
        renderManagementData(data);
    } catch (error) {
        if (error.message.includes("log in") || error.message.includes("Administrator")) {
            window.location.href = "../login.html";
            return;
        }
        showPageError("managementError", error.message);
    }
}

function renderManagementData(data) {
    const garageTable = document.getElementById("garagesTable");
    garageTable.replaceChildren();
    data.garages.forEach(function (garage) {
        const row = garageTable.insertRow();
        [garage.name, garage.address, garage.phone || "—", garage.services || "None", Number(garage.active) ? "Yes" : "No"]
            .forEach(function (value) { row.insertCell().textContent = value; });
        const action = row.insertCell();
        addEditButton(action, "Edit", function () { editGarage(garage); });
    });

    const garageOptions = document.getElementById("mechanicGarage");
    const selectedGarage = garageOptions.value;
    garageOptions.replaceChildren();
    const garagePlaceholder = document.createElement("option");
    garagePlaceholder.value = "";
    garagePlaceholder.textContent = data.garages.length ? "Choose a garage" : "Add a garage first";
    garageOptions.appendChild(garagePlaceholder);
    data.garages.filter(function (garage) { return Number(garage.active); }).forEach(function (garage) {
        const option = document.createElement("option");
        option.value = garage.id;
        option.textContent = garage.name;
        garageOptions.appendChild(option);
    });
    if (selectedGarage) {
        garageOptions.value = selectedGarage;
    }

    const mechanicsTable = document.getElementById("mechanicsTable");
    mechanicsTable.replaceChildren();
    data.mechanics.forEach(function (mechanic) {
        const row = mechanicsTable.insertRow();
        [mechanic.name, mechanic.garage_name, [mechanic.email, mechanic.phone].filter(Boolean).join(" · ") || "—",
            mechanic.services || "None", Number(mechanic.active) ? "Yes" : "No"]
            .forEach(function (value) { row.insertCell().textContent = value; });
        const action = row.insertCell();
        addEditButton(action, "Edit", function () { editMechanic(mechanic); });
    });

    const partsTable = document.getElementById("partsInventoryTable");
    partsTable.replaceChildren();
    data.inventory.forEach(function (part) {
        const row = partsTable.insertRow();
        [part.sku, part.part_name, part.stock_quantity, money(part.unit_cost)]
            .forEach(function (value) { row.insertCell().textContent = value; });
        const action = row.insertCell();
        addEditButton(action, "Edit", function () { editInventoryItem(part); });
    });
}

function addEditButton(container, label, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm btn-outline-primary";
    button.textContent = label;
    button.addEventListener("click", handler);
    container.appendChild(button);
}

function selectedMultiValues(id) {
    return Array.from(document.getElementById(id).selectedOptions).map(function (option) {
        return option.value;
    });
}

function selectMultiValues(id, values) {
    const selected = new Set(values || []);
    Array.from(document.getElementById(id).options).forEach(function (option) {
        option.selected = selected.has(option.value);
    });
}

async function submitManagementForm(action, payload, successMessage) {
    try {
        const result = await serviceApi(action, { method: "POST", body: JSON.stringify(payload) });
        const message = document.getElementById("managementMessage");
        message.textContent = result.message || successMessage;
        message.className = "alert alert-success";
        message.hidden = false;
        document.getElementById("managementError").hidden = true;
        await loadManagementData();
        return true;
    } catch (error) {
        showPageError("managementError", error.message);
        return false;
    }
}

async function saveGarage(event) {
    event.preventDefault();
    const form = document.getElementById("garageForm");
    const saved = await submitManagementForm("garage-save", {
        id: document.getElementById("garageId").value || null,
        name: document.getElementById("garageName").value.trim(),
        address: document.getElementById("garageAddress").value.trim(),
        phone: document.getElementById("garagePhone").value.trim(),
        active: document.getElementById("garageActive").checked,
        services: selectedMultiValues("garageServices")
    }, "Garage saved.");
    if (saved) {
        form.reset();
        document.getElementById("garageId").value = "";
    }
}

function editGarage(garage) {
    document.getElementById("garageId").value = garage.id;
    document.getElementById("garageName").value = garage.name;
    document.getElementById("garageAddress").value = garage.address;
    document.getElementById("garagePhone").value = garage.phone;
    document.getElementById("garageActive").checked = Number(garage.active) === 1;
    selectMultiValues("garageServices", garage.services ? garage.services.split(",") : []);
    document.getElementById("garageName").focus();
}

function resetGarageForm() {
    document.getElementById("garageForm").reset();
    document.getElementById("garageId").value = "";
}

async function saveMechanic(event) {
    event.preventDefault();
    const form = document.getElementById("mechanicForm");
    const saved = await submitManagementForm("mechanic-save", {
        id: document.getElementById("mechanicId").value || null,
        garage_id: Number(document.getElementById("mechanicGarage").value),
        name: document.getElementById("mechanicName").value.trim(),
        email: document.getElementById("mechanicEmail").value.trim(),
        phone: document.getElementById("mechanicPhone").value.trim(),
        active: document.getElementById("mechanicActive").checked,
        services: selectedMultiValues("mechanicServices")
    }, "Mechanic saved.");
    if (saved) {
        form.reset();
        document.getElementById("mechanicId").value = "";
    }
}

function editMechanic(mechanic) {
    document.getElementById("mechanicId").value = mechanic.id;
    document.getElementById("mechanicGarage").value = mechanic.garage_id;
    document.getElementById("mechanicName").value = mechanic.name;
    document.getElementById("mechanicEmail").value = mechanic.email;
    document.getElementById("mechanicPhone").value = mechanic.phone;
    document.getElementById("mechanicActive").checked = Number(mechanic.active) === 1;
    selectMultiValues("mechanicServices", mechanic.services ? mechanic.services.split(",") : []);
    document.getElementById("mechanicName").focus();
}

function resetMechanicForm() {
    document.getElementById("mechanicForm").reset();
    document.getElementById("mechanicId").value = "";
}

async function saveInventoryItem(event) {
    event.preventDefault();
    const form = document.getElementById("inventoryForm");
    const saved = await submitManagementForm("inventory-save", {
        id: document.getElementById("inventoryId").value || null,
        sku: document.getElementById("partSku").value.trim(),
        part_name: document.getElementById("partName").value.trim(),
        stock_quantity: Number(document.getElementById("partQuantity").value),
        unit_cost: Number(document.getElementById("partCost").value)
    }, "Inventory item saved.");
    if (saved) {
        form.reset();
        document.getElementById("inventoryId").value = "";
    }
}

function editInventoryItem(part) {
    document.getElementById("inventoryId").value = part.id;
    document.getElementById("partSku").value = part.sku;
    document.getElementById("partName").value = part.part_name;
    document.getElementById("partQuantity").value = part.stock_quantity;
    document.getElementById("partCost").value = part.unit_cost;
    document.getElementById("partSku").focus();
}

function resetInventoryForm() {
    document.getElementById("inventoryForm").reset();
    document.getElementById("inventoryId").value = "";
}


// ======================================================
// CURRENT DATE
// ======================================================

function showCurrentDate() {

    const dateElement = document.getElementById("currentDate");

    if (dateElement) {

        const date = new Date();

        dateElement.textContent = date.toDateString();

    }

}


// ======================================================
// LOGIN VALIDATION
// ======================================================

async function loginUser() {

    const emailElement = document.getElementById("email");
    const passwordElement = document.getElementById("password");

    if (!emailElement || !passwordElement) {

        console.error("Login fields not found.");
        return false;

    }

    const email = emailElement.value.trim();
    const password = passwordElement.value;


    if (email === "" || password === "") {

        alert("Please enter Email and Password.");

        return false;

    }


    try {
        const result = await serviceApi("login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });
        window.location.href = result.role === "employee" || result.role === "admin"
            ? "service-desk.html"
            : "customer/dashboard.html";
    } catch (error) {
        alert(error.message);
    }
    return false;

}


// ======================================================
// REGISTRATION VALIDATION
// ======================================================

function registerUser() {

    const nameElement = document.getElementById("name");
    const emailElement = document.getElementById("email");
    const passwordElement = document.getElementById("password");

    if (!nameElement || !emailElement || !passwordElement) {

        console.error("Registration fields not found.");
        return false;

    }

    const name = nameElement.value.trim();
    const email = emailElement.value.trim();
    const password = passwordElement.value.trim();


    if (name === "" || email === "" || password === "") {

        alert("Please fill all required fields.");

        return false;

    }


    if (password.length < 6) {

        alert("Password must contain at least 6 characters.");

        return false;

    }


    alert("Registration Successful!");


    window.location.href = "login.html";


    return false;

}


// ======================================================
// BOOK SERVICE
// ======================================================

function populateBookingTimeOptions() {
    const hourSelect = document.getElementById("bookingHour");
    const minuteSelect = document.getElementById("bookingMinute");
    if (!hourSelect || !minuteSelect) {
        return;
    }
    for (let hour = 1; hour <= 12; hour++) {
        hourSelect.add(new Option(String(hour), String(hour)));
    }
    for (let minute = 0; minute < 60; minute += 5) {
        const value = String(minute).padStart(2, "0");
        minuteSelect.add(new Option(value, value));
    }
}

function getBookingTime24Hour() {
    const hour = Number(document.getElementById("bookingHour").value);
    const minute = document.getElementById("bookingMinute").value;
    const period = document.getElementById("bookingPeriod").value;
    if (!hour || !minute || !period) {
        return "";
    }
    const hour24 = (hour % 12) + (period === "PM" ? 12 : 0);
    return String(hour24).padStart(2, "0") + ":" + minute;
}

async function bookService() {
    const form = document.getElementById("bookingForm");
    const message = document.getElementById("bookingMessage");
    if (!form || !form.reportValidity()) {
        return;
    }
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton.disabled) {
        return;
    }
    submitButton.disabled = true;
    const data = {
        vehicle: document.getElementById("bookingVehicle").value.trim(),
        vehicle_number: document.getElementById("vehicleNumber").value.trim(),
        garage_id: document.getElementById("bookingGarage").value,
        service: document.getElementById("serviceType").value,
        date: document.getElementById("bookingDate").value,
        time: getBookingTime24Hour(),
        problem: document.getElementById("problemDescription").value.trim()
    };
    try {
        const result = await serviceApi("book", {
            method: "POST",
            body: JSON.stringify(data)
        });
        window.location.href = "track-service.html?booking=" +
            encodeURIComponent(result.booking.booking_code);
    } catch (error) {
        submitButton.disabled = false;
        if (message) {
            message.textContent = error.message;
            message.className = "alert alert-danger";
            message.hidden = false;
        } else {
            alert(error.message);
        }
    }
}

function updateBookingEstimate() {
    const estimates = {
        "General Service": ["₹3,500", "2 hours"],
        "Oil Change": ["₹1,800", "45 minutes"],
        "Brake Service": ["₹4,000", "1 hour"],
        "Battery Replacement": ["₹6,500", "30 minutes"],
        "Engine Repair": ["₹8,000", "4 hours"],
        "AC Service": ["₹1,800", "1.5 hours"],
        "Wheel Alignment": ["₹1,200", "45 minutes"],
        "Tyre Replacement": ["₹6,000", "1 hour"]
    };
    const service = document.getElementById("serviceType");
    const estimate = service && estimates[service.value];
    if (estimate) {
        document.getElementById("estimatedCost").textContent = estimate[0];
        document.getElementById("estimatedTime").textContent = estimate[1];
    }
    populateBookingGarageOptions();
}

async function loadBookingGarages() {
    const garageSelect = document.getElementById("bookingGarage");
    const message = document.getElementById("bookingMessage");
    if (!garageSelect) {
        return;
    }

    try {
        const result = await serviceApi("booking-garages");
        availableBookingGarages = result.garages;
        populateBookingGarageOptions();
        if (availableBookingGarages.length === 0) {
            message.textContent = "No active garages are set up yet. Please ask an administrator to add a garage and its available services before booking.";
            message.className = "alert alert-warning";
            message.hidden = false;
        } else if (message.classList.contains("alert-warning")) {
            message.hidden = true;
        }
    } catch (error) {
        garageSelect.replaceChildren(new Option("Unable to load garages", ""));
        message.textContent = error.message;
        message.className = "alert alert-danger";
        message.hidden = false;
        if (error.message.includes("log in")) {
            window.location.href = "login.html";
        }
    }
}

function populateBookingGarageOptions() {
    const garageSelect = document.getElementById("bookingGarage");
    const serviceSelect = document.getElementById("serviceType");
    if (!garageSelect || !serviceSelect) {
        return;
    }

    const selectedGarageId = garageSelect.value;
    const serviceGarages = availableBookingGarages.filter(function (garage) {
        return garage.services.includes(serviceSelect.value);
    });
    garageSelect.replaceChildren(new Option(
        serviceGarages.length ? "Choose a garage" : "No garages offer this service",
        ""
    ));
    serviceGarages.forEach(function (garage) {
        const address = garage.address ? " — " + garage.address : "";
        garageSelect.add(new Option(garage.name + address, String(garage.id)));
    });
    if (serviceGarages.some(function (garage) {
        return String(garage.id) === selectedGarageId;
    })) {
        garageSelect.value = selectedGarageId;
    }
}

function customerBookingStatus(booking) {
    if (booking.status === "Booked" && booking.assigned_garage_id) {
        return "🟡 Service Scheduled";
    }
    return booking.status;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value === null || value === undefined || value === ""
            ? "Not provided"
            : value;
    }
}

function money(value) {
    return "₹" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function showPageError(id, message) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = message;
        element.hidden = false;
    }
}

async function loadTrackedBooking(code) {
    try {
        const result = await serviceApi("get&code=" + encodeURIComponent(code));
        renderTrackedBooking(result.booking);
    } catch (error) {
        if (error.message.includes("log in")) {
            window.location.href = "login.html";
            return;
        }
        showPageError("trackingError", error.message);
    }
}

function renderTrackedBooking(booking) {
    document.getElementById("trackingDetails").hidden = false;
    setText("trackingCode", booking.booking_code);
    setText("trackingVehicle", booking.vehicle_model + " (" + booking.vehicle_number + ")");
    setText("trackingService", booking.service_type);
    setText("trackingAppointment", booking.preferred_date + " at " + formatTimeForDisplay(booking.preferred_time));
    setText("trackingAssignment", [booking.garage_name, booking.mechanic_name].filter(Boolean).join(" / "));
    setText("trackingProblem", booking.problem_description);
    const scheduled = booking.status === "Booked" && booking.assigned_garage_id;
    const currentWork = scheduled && booking.current_work === "Service scheduled"
        ? ""
        : " — " + booking.current_work;
    setText("trackingStatus", customerBookingStatus(booking) + currentWork);
    setText("trackingProgress", booking.progress + "%");
    setText("trackingCost", money(booking.updated_estimated_cost));
    setText("trackingTime", booking.updated_estimated_minutes + " minutes remaining");
    setText("trackingDecision", booking.repair_decision);
    setText("trackingWarranty", booking.warranty_info);
    setText("trackingNotes", booking.mechanic_notes);
    const progress = document.getElementById("trackingProgressBar");
    progress.style.width = booking.progress + "%";
    progress.setAttribute("aria-valuenow", booking.progress);

    const parts = document.getElementById("trackingParts");
    parts.replaceChildren();
    if (!booking.parts.length) {
        const row = parts.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 4;
        cell.textContent = "No parts recorded yet.";
    } else {
        booking.parts.forEach(function (part) {
            const row = parts.insertRow();
            [part.part_name, part.action, part.quantity || 1, part.warranty_info].forEach(function (value) {
                row.insertCell().textContent = value;
            });
        });
    }

    const events = document.getElementById("trackingEvents");
    events.replaceChildren();
    booking.events.forEach(function (event) {
        const item = document.createElement("li");
        item.className = "list-group-item";
        item.textContent = event.event_text + " — " + event.created_at;
        events.appendChild(item);
    });
}

function formatTimeForDisplay(time) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(String(time));
    if (!match) {
        return time;
    }
    const hour24 = Number(match[1]);
    const period = hour24 < 12 ? "AM" : "PM";
    const hour12 = hour24 % 12 || 12;
    return hour12 + ":" + match[2] + " " + period;
}

async function loadCustomerDashboard() {
    try {
        const [session, result] = await Promise.all([
            serviceApi("session"),
            serviceApi("list")
        ]);
        if (!session.authenticated || session.role !== "customer") {
            window.location.href = "../login.html";
            return;
        }
        setText("dashboardWelcome", "Welcome, " + session.name);
        const bookings = result.bookings;
        setText("dashboardActiveCount", bookings.filter(function (booking) {
            return !["Completed", "Cancelled"].includes(booking.status);
        }).length);
        setText("dashboardVehicleCount", new Set(bookings.map(function (booking) {
            return booking.vehicle_number;
        })).size);
        setText("dashboardSpent", money(bookings.filter(function (booking) {
            return booking.status === "Completed";
        }).reduce(function (total, booking) {
            return total + Number(booking.updated_estimated_cost);
        }, 0)));
        const table = document.getElementById("dashboardBookings");
        table.replaceChildren();
        if (!bookings.length) {
            const row = table.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = "No bookings yet. Book a service to get started.";
        }
        bookings.forEach(function (booking) {
            const row = table.insertRow();
            [booking.booking_code, booking.vehicle_model, booking.service_type, money(booking.updated_estimated_cost), customerBookingStatus(booking)]
                .forEach(function (value) {
                    row.insertCell().textContent = value;
                });
            const action = row.insertCell();
            if (booking.status !== "Cancelled") {
                const payButton = document.createElement("button");
                payButton.type = "button";
                payButton.className = "btn btn-sm btn-success me-2";
                payButton.textContent = "Pay online";
                payButton.addEventListener("click", function () {
                    showPaymentDialog(booking);
                });
                action.appendChild(payButton);
            }
            const link = document.createElement("a");
            link.className = "btn btn-sm btn-outline-primary";
            link.href = "../track-service.html?booking=" + encodeURIComponent(booking.booking_code);
            link.textContent = "Track";
            action.appendChild(link);
        });
    } catch (error) {
        if (error.message.includes("log in")) {
            window.location.href = "../login.html";
            return;
        }
        showPageError("dashboardError", error.message);
    }
}

function showPaymentDialog(booking) {
    const dialog = document.getElementById("paymentDialog");
    if (!dialog || typeof dialog.showModal !== "function") {
        showPageError("dashboardError", "Online payment is not supported by this browser.");
        return;
    }
    setText("paymentBookingCode", booking.booking_code);
    setText("paymentAmount", money(booking.updated_estimated_cost));
    setPaymentMethod("upi");
    dialog.showModal();
}

function setPaymentMethod(method) {
    const isUpi = method === "upi";
    document.getElementById("paymentMethodUpi").setAttribute("aria-pressed", String(isUpi));
    document.getElementById("paymentMethodCard").setAttribute("aria-pressed", String(!isUpi));
    document.getElementById("paymentUpiPanel").hidden = !isUpi;
    document.getElementById("paymentCardPanel").hidden = isUpi;
}

async function loadServiceDesk() {
    try {
        const [session, result, options] = await Promise.all([
            serviceApi("session"),
            serviceApi("list"),
            serviceApi("staff-options")
        ]);
        if (!session.authenticated || !["employee", "admin"].includes(session.role)) {
            window.location.href = "login.html";
            return;
        }
        currentStaffBookings = result.bookings;
        staffServiceOptions = options;
        const managementLink = document.getElementById("managementLink");
        if (managementLink && session.role === "admin") {
            managementLink.hidden = false;
        }
        const assignmentSection = document.getElementById("bookingAssignmentSection");
        if (assignmentSection && session.role === "admin") {
            assignmentSection.hidden = false;
            populateAssignmentGarages();
        }
        renderInventoryStock(options.inventory);
        const select = document.getElementById("serviceDeskBookings");
        const selectedBookingId = select.value;
        select.replaceChildren();
        result.bookings.forEach(function (booking) {
            const option = document.createElement("option");
            option.value = booking.id;
            option.textContent = booking.booking_code + " — " + booking.vehicle_model + " — " + booking.status;
            select.appendChild(option);
        });
        if (result.bookings.some(function (booking) {
            return String(booking.id) === selectedBookingId;
        })) {
            select.value = selectedBookingId;
        }
        if (!result.bookings.length) {
            showPageError("serviceDeskError", "There are no service bookings yet.");
            return;
        }
        populateServiceUpdate(result.bookings.find(function (booking) {
            return String(booking.id) === select.value;
        }));
        populateCurrentAssignment(result.bookings.find(function (booking) {
            return String(booking.id) === select.value;
        }));
    } catch (error) {
        if (error.message.includes("log in")) {
            window.location.href = "login.html";
            return;
        }
        showPageError("serviceDeskError", error.message);
    }
}

async function loadSelectedServiceBooking() {
    const id = document.getElementById("serviceDeskBookings").value;
    if (!id) {
        return;
    }
    try {
        const result = await serviceApi("get&id=" + encodeURIComponent(id));
        populateServiceUpdate(result.booking);
        populateCurrentAssignment(result.booking);
    } catch (error) {
        showPageError("serviceDeskError", error.message);
    }
}

function populateServiceUpdate(booking) {
    if (!booking) {
        return;
    }
    const summary = document.getElementById("serviceDeskSummary");
    summary.textContent = booking.customer_name + " — " + booking.vehicle_model +
        " (" + booking.vehicle_number + ") — " + booking.service_type +
        ". Reported problem: " + booking.problem_description +
        ". Assigned: " + (booking.garage_name || "No garage") +
        (booking.mechanic_name ? " / " + booking.mechanic_name : "");
    document.getElementById("serviceBookingId").value = booking.id;
    document.getElementById("serviceStatus").value = booking.status;
    document.getElementById("serviceWork").value = booking.current_work;
    document.getElementById("serviceProgress").value = booking.progress;
    document.getElementById("serviceDecision").value = booking.repair_decision;
    document.getElementById("serviceCost").value = booking.updated_estimated_cost;
    document.getElementById("serviceMinutes").value = booking.updated_estimated_minutes;
    document.getElementById("serviceWarranty").value = booking.warranty_info;
    document.getElementById("serviceNotes").value = booking.mechanic_notes;
    document.getElementById("serviceParts").value = booking.parts.filter(function (part) {
        return !part.inventory_item_id;
    }).map(function (part) {
        return [part.part_name, part.action, part.warranty_info].join(" | ");
    }).join("\n");
}

function populateAssignmentGarages() {
    const select = document.getElementById("assignmentGarage");
    if (!select || !staffServiceOptions) {
        return;
    }
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a garage";
    select.appendChild(placeholder);
    staffServiceOptions.garages.forEach(function (garage) {
        const option = document.createElement("option");
        option.value = garage.id;
        option.textContent = garage.name;
        select.appendChild(option);
    });
    populateAssignmentMechanics();
}

function populateAssignmentMechanics() {
    const garageId = document.getElementById("assignmentGarage").value;
    const bookingId = document.getElementById("serviceDeskBookings").value;
    const booking = currentStaffBookings.find(function (entry) {
        return String(entry.id) === bookingId;
    });
    const garage = staffServiceOptions && staffServiceOptions.garages.find(function (entry) {
        return String(entry.id) === garageId;
    });
    const garageServices = garage && garage.services ? garage.services.split(",") : [];
    const select = document.getElementById("assignmentMechanic");
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a mechanic";
    select.appendChild(placeholder);
    (staffServiceOptions ? staffServiceOptions.mechanics : []).filter(function (mechanic) {
        const services = mechanic.services ? mechanic.services.split(",") : [];
        return String(mechanic.garage_id) === garageId &&
            (!booking || (garageServices.includes(booking.service_type) && services.includes(booking.service_type)));
    }).forEach(function (mechanic) {
        const option = document.createElement("option");
        option.value = mechanic.id;
        option.textContent = mechanic.name;
        select.appendChild(option);
    });
}

function populateCurrentAssignment(booking) {
    if (!staffServiceOptions || document.getElementById("bookingAssignmentSection").hidden) {
        return;
    }
    const garage = staffServiceOptions.garages.find(function (entry) {
        return String(entry.id) === String(booking.assigned_garage_id);
    });
    document.getElementById("assignmentGarage").value = garage ? String(garage.id) : "";
    populateAssignmentMechanics();
    document.getElementById("assignmentMechanic").value = booking.assigned_mechanic_id
        ? String(booking.assigned_mechanic_id)
        : "";
}

async function saveBookingAssignment(event) {
    event.preventDefault();
    const bookingId = document.getElementById("serviceDeskBookings").value;
    try {
        const result = await serviceApi("assign", {
            method: "POST",
            body: JSON.stringify({
                booking_id: Number(bookingId),
                garage_id: document.getElementById("assignmentGarage").value,
                mechanic_id: document.getElementById("assignmentMechanic").value
            })
        });
        const message = document.getElementById("serviceDeskMessage");
        message.textContent = "Garage and mechanic assigned.";
        message.className = "alert alert-success";
        message.hidden = false;
        await loadServiceDesk();
        populateCurrentAssignment(result.booking);
    } catch (error) {
        showPageError("serviceDeskError", error.message);
    }
}

function renderInventoryStock(items) {
    const container = document.getElementById("inventoryStockList");
    if (!container) {
        return;
    }
    const table = document.createElement("table");
    table.className = "table table-sm align-middle mb-0";
    const head = table.createTHead().insertRow();
    ["Part", "SKU", "Available stock"].forEach(function (label) {
        const cell = document.createElement("th");
        cell.textContent = label;
        head.appendChild(cell);
    });
    const body = table.createTBody();
    if (!items.length) {
        const row = body.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 3;
        cell.textContent = "No parts have been added to inventory.";
    }
    items.forEach(function (item) {
        const row = body.insertRow();
        [item.part_name, item.sku, item.stock_quantity].forEach(function (value) {
            row.insertCell().textContent = value;
        });
    });
    container.replaceChildren(table);
    const select = document.getElementById("inventoryPart");
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = items.length ? "Choose a part" : "No parts in stock";
    select.appendChild(placeholder);
    items.filter(function (item) {
        return Number(item.stock_quantity) > 0;
    }).forEach(function (item) {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.part_name + " — " + item.stock_quantity + " in stock";
        select.appendChild(option);
    });
}

async function recordInventoryUse(event) {
    event.preventDefault();
    const bookingId = document.getElementById("serviceDeskBookings").value;
    if (!bookingId) {
        showPageError("serviceDeskError", "Select a booking before recording parts.");
        return;
    }
    try {
        const result = await serviceApi("inventory-use", {
            method: "POST",
            body: JSON.stringify({
                booking_id: Number(bookingId),
                inventory_id: Number(document.getElementById("inventoryPart").value),
                quantity: Number(document.getElementById("inventoryQuantity").value)
            })
        });
        const message = document.getElementById("serviceDeskMessage");
        message.textContent = result.message;
        message.className = "alert alert-success";
        message.hidden = false;
        const options = await serviceApi("staff-options");
        staffServiceOptions = options;
        renderInventoryStock(options.inventory);
        await loadSelectedServiceBooking();
    } catch (error) {
        showPageError("serviceDeskError", error.message);
    }
}

async function saveServiceUpdate(event) {
    event.preventDefault();
    const parts = document.getElementById("serviceParts").value.split("\n")
        .map(function (line) {
            const values = line.split("|").map(function (value) { return value.trim(); });
            return { part_name: values[0], action: values[1], warranty_info: values[2] || "" };
        })
        .filter(function (part) { return part.part_name !== ""; });
    const payload = {
        id: Number(document.getElementById("serviceBookingId").value),
        status: document.getElementById("serviceStatus").value,
        current_work: document.getElementById("serviceWork").value.trim(),
        progress: Number(document.getElementById("serviceProgress").value),
        repair_decision: document.getElementById("serviceDecision").value,
        updated_estimated_cost: Number(document.getElementById("serviceCost").value),
        updated_estimated_minutes: Number(document.getElementById("serviceMinutes").value),
        warranty_info: document.getElementById("serviceWarranty").value.trim(),
        mechanic_notes: document.getElementById("serviceNotes").value.trim(),
        parts: parts
    };
    try {
        const result = await serviceApi("update", { method: "POST", body: JSON.stringify(payload) });
        const message = document.getElementById("serviceDeskMessage");
        message.textContent = "Service information saved.";
        message.className = "alert alert-success";
        message.hidden = false;
        const selectedOption = document.getElementById("serviceDeskBookings").selectedOptions[0];
        selectedOption.textContent = result.booking.booking_code + " — " +
            result.booking.vehicle_model + " — " + result.booking.status;
        populateServiceUpdate(result.booking);
    } catch (error) {
        showPageError("serviceDeskError", error.message);
    }
}


function markNotificationsRead() {

    const message = document.getElementById("notificationMessage");

    if (message) {

        message.textContent = "All notifications have been marked as read.";

    }

}


function saveProfile() {

    const name = document.getElementById("profileName");
    const email = document.getElementById("profileEmail");
    const message = document.getElementById("profileMessage");

    if (!name || !email || !message) {

        return;

    }

    if (name.value.trim() === "" || email.value.trim() === "") {

        message.textContent = "Please enter your name and email.";
        message.className = "text-danger mb-2";
        return;

    }

    message.textContent = "Profile saved successfully.";
    message.className = "text-success mb-2";

}


// ======================================================
// AI VEHICLE ASSISTANT
// ======================================================

function openAssistant() {

    const input = document.getElementById("dashboardAiMessage");
    const question = input ? input.value.trim() : "";

    if (question === "") {

        window.location.href = "../ai-chat.html";
        return;

    }

    sessionStorage.setItem("pendingAiQuestion", question);
    window.location.href = "../ai-chat.html";

}

function startNewChat() {
    const chat = document.getElementById("chatArea");
    const welcome = document.getElementById("welcomeMessage");
    const input = document.getElementById("userMessage");
    if (!chat || !welcome || !input) {
        console.error("New Chat Error: chat area, welcome message, or input was not found.");
        return;
    }
    sessionStorage.removeItem("pendingAiQuestion");
    chat.replaceChildren(welcome);
    input.value = "";
    input.focus();
    chat.scrollTop = 0;
}

function sendMessage() {

    const input = document.getElementById("userMessage");
    const chat = document.getElementById("chatArea");


    // Check whether AI chat elements exist
    if (!input || !chat) {

        console.error(
            "AI Chat Error: userMessage or chatArea was not found."
        );

        alert("AI Assistant is not connected correctly.");

        return;

    }


    const question = input.value.trim();


    // Empty question
    if (question === "") {

        alert("Please enter a vehicle question.");

        input.focus();

        return;

    }


    // ==================================================
    // USER MESSAGE
    // ==================================================

    const userMessage = document.createElement("div");

    userMessage.className = "user mb-3 text-end";


    const userText = document.createElement("span");

    userText.className = "badge bg-primary p-3";

    userText.textContent = question;


    userMessage.appendChild(userText);

    chat.appendChild(userMessage);


    // Clear input
    input.value = "";


    // Scroll
    chat.scrollTop = chat.scrollHeight;


    // ==================================================
    // AI THINKING MESSAGE
    // ==================================================

    const thinkingMessage = document.createElement("div");

    thinkingMessage.className = "ai mb-3";

    thinkingMessage.id = "thinkingMessage";


    const thinkingText = document.createElement("span");

    thinkingText.className = "badge bg-secondary p-3";

    thinkingText.textContent =
        "🤖 AI is checking your vehicle information...";


    thinkingMessage.appendChild(thinkingText);

    chat.appendChild(thinkingMessage);


    chat.scrollTop = chat.scrollHeight;


    // ==================================================
    // GENERATE AI RESPONSE
    // ==================================================

    setTimeout(function () {


        // Remove thinking message
        const oldThinking =
            document.getElementById("thinkingMessage");


        if (oldThinking) {

            oldThinking.remove();

        }


        // Get answer
        const answer = getVehicleAnswer(question);


        // Create AI message
        const aiMessage = document.createElement("div");

        aiMessage.className = "ai mb-3";


        const aiText = document.createElement("span");

        aiText.className = "badge bg-success p-3 text-start";


        // AI answers contain trusted HTML formatting
        aiText.innerHTML = answer;


        aiMessage.appendChild(aiText);

        chat.appendChild(aiMessage);


        // Scroll to bottom
        chat.scrollTop = chat.scrollHeight;


    }, 800);

}


// ======================================================
// AI VEHICLE ANSWERS
// ======================================================

function getVehicleAnswer(question) {

    const q = question.toLowerCase().trim();

    const problemPrediction = getVehicleProblemPrediction(q);
    if (problemPrediction) {
        return problemPrediction;
    }

    if (typeof getIndiaVehiclePartAnswer === "function") {
        const vehiclePartAnswer = getIndiaVehiclePartAnswer(question);
        if (vehiclePartAnswer) {
            return vehiclePartAnswer;
        }
    }


    // ==================================================
    // GREETING
    // ==================================================

    if (
        q.includes("hello") ||
        q.includes("hi") ||
        q.includes("hey")
    ) {

        return `
            <strong>👋 Hello!</strong>
            <br><br>

            I am your <strong>AI Vehicle Assistant</strong>.
            <br><br>

            You can ask me about:
            <br>
            🚗 Vehicle repairs
            <br>
            💰 Service costs
            <br>
            ⏱️ Service time
            <br>
            🔋 Battery warranty
            <br>
            🛢️ Engine oil
            <br>
            ❄️ AC service
            <br>
            📋 Service status
        `;

    }


    // ==================================================
    // BRAKE
    // ==================================================

    if (
        q.includes("brake") ||
        q.includes("brake pad")
    ) {

        return `
            <strong>🚗 Brake Pad Replacement</strong>
            <br><br>

            <strong>Estimated Cost:</strong>
            ₹3,500 - ₹4,500
            <br>

            <strong>Service Time:</strong>
            45 Minutes - 1 Hour
            <br>

            <strong>Warranty:</strong>
            6 Months
            <br>

            <strong>Labor Charge:</strong>
            ₹800
            <br><br>

            ⚠️ Brake pad replacement may be required if
            you hear squeaking or grinding noises or notice
            reduced braking performance.
        `;

    }


    // ==================================================
    // ENGINE OIL
    // ==================================================

    if (
        q.includes("oil") ||
        q.includes("engine oil")
    ) {

        return `
            <strong>🛢️ Engine Oil Change</strong>
            <br><br>

            <strong>Estimated Cost:</strong>
            ₹1,500 - ₹3,500
            <br>

            <strong>Service Time:</strong>
            30 - 45 Minutes
            <br>

            <strong>Recommended Interval:</strong>
            Usually every 8,000 - 10,000 km,
            depending on the vehicle manufacturer.
            <br><br>

            ✅ Always use the oil grade recommended
            for your vehicle.
        `;

    }

    if (
        q.includes("overheat") ||
        q.includes("overheating") ||
        q.includes("temperature is high") ||
        q.includes("engine hot")
    ) {
        return `
            <strong>🌡️ If your car is overheating</strong>
            <br><br>
            Pull over somewhere safe and switch off the engine. Do not open the radiator cap while the engine is hot; pressurized coolant can cause severe burns.
            <br><br>
            Once the engine has cooled, check for visible coolant leaks or a low coolant level. If the temperature warning remains, steam appears, or coolant is leaking, do not continue driving—arrange roadside assistance or a mechanic inspection.
            <br><br>
            Possible causes include low coolant, a cooling-system leak, a faulty thermostat, radiator fan, water pump, or a blocked radiator. A mechanic must inspect the vehicle to confirm the cause.
        `;
    }


    // ==================================================
    // BATTERY
    // ==================================================

    if (
        q.includes("battery") ||
        q.includes("warranty")
    ) {

        return `
            <strong>🔋 Vehicle Battery</strong>
            <br><br>

            <strong>Estimated Cost:</strong>
            ₹4,000 - ₹9,000
            <br>

            <strong>Replacement Time:</strong>
            Approximately 30 Minutes
            <br>

            <strong>Typical Warranty:</strong>
            2 - 4 Years
            <br><br>

            ⚠️ Actual warranty depends on the
            battery manufacturer and vehicle model.
        `;

    }


    // ==================================================
    // AC SERVICE
    // ==================================================

    if (
        q.includes("ac") ||
        q.includes("air conditioner") ||
        q.includes("air conditioning") ||
        q.includes("cooling")
    ) {

        return `
            <strong>❄️ AC Service</strong>
            <br><br>

            <strong>Basic AC Service:</strong>
            ₹1,000 - ₹2,500
            <br>

            <strong>Gas Refill:</strong>
            ₹800 - ₹1,500
            <br>

            <strong>Service Time:</strong>
            1 - 2 Hours
            <br><br>

            🔧 Final cost depends on the actual problem
            and required parts.
        `;

    }


    // ==================================================
    // ENGINE REPAIR
    // ==================================================

    if (
        q.includes("engine repair") ||
        q.includes("engine problem") ||
        q.includes("engine")
    ) {

        return `
            <strong>⚙️ Engine Repair</strong>
            <br><br>

            Engine repair cost depends on the exact problem.
            <br><br>

            <strong>Basic Diagnosis:</strong>
            ₹500 - ₹1,000
            <br>

            <strong>Minor Repair:</strong>
            ₹2,000+
            <br>

            <strong>Major Repair:</strong>
            ₹10,000+
            <br><br>

            🔧 A mechanic should inspect the vehicle
            before providing the final estimate.
        `;

    }


    // ==================================================
    // SERVICE TIME
    // ==================================================

    if (
        q.includes("how long") ||
        q.includes("how much time") ||
        q.includes("time") ||
        q.includes("take") ||
        q.includes("service time") ||
        q.includes("duration")
    ) {

        return `
            <strong>⏱️ Estimated Service Time</strong>
            <br><br>

            <strong>Basic Service:</strong>
            1 - 2 Hours
            <br>

            <strong>Oil Change:</strong>
            30 - 45 Minutes
            <br>

            <strong>Brake Pad Replacement:</strong>
            45 - 60 Minutes
            <br>

            <strong>AC Service:</strong>
            1 - 2 Hours
            <br><br>

            The actual time may vary depending on
            the vehicle and required repairs.
        `;

    }


    // ==================================================
    // COST / PRICE
    // ==================================================

    if (
        q.includes("cost") ||
        q.includes("price") ||
        q.includes("charge") ||
        q.includes("how much")
    ) {

        return `
            <strong>💰 Service Cost</strong>
            <br><br>

            Please tell me which vehicle part or service
            you want the price for.
            <br><br>

            Examples:
            <br>
            🚗 Brake pad cost
            <br>
            🛢️ Engine oil cost
            <br>
            🔋 Battery cost
            <br>
            ❄️ AC repair cost
            <br>
            ⚙️ Engine repair cost
        `;

    }


    if (
        q.includes("notification") ||
        q.includes("alert") ||
        q.includes("reminder")
    ) {

        return `
            <strong>🔔 Service Notifications</strong>
            <br><br>

            Open the <strong>Track Service</strong> page to see the latest
            status, progress, revised estimate, and service history for your booking.
        `;

    }


    if (
        q.includes("invoice") ||
        q.includes("payment") ||
        q.includes("receipt")
    ) {

        return `
            <strong>🧾 Invoices and Payments</strong>
            <br><br>

            Your latest service invoice is <strong>₹7,900</strong>.
            <br>
            Payment history and outstanding balances are available
            in the dashboard under <strong>Payments</strong>.
        `;

    }


    // ==================================================
    // VEHICLE STATUS
    // ==================================================

    if (
        q.includes("status") ||
        q.includes("track") ||
        q.includes("progress") ||
        q.includes("my vehicle")
    ) {

        return `
            <strong>🚘 Vehicle Service Status</strong>
            <br><br>

            Your vehicle service status can be checked
            from the <strong>Track Service</strong> page.
            <br><br>

            You can check:
            <br>
            ✅ Service progress
            <br>
            ✅ Current repair
            <br>
            ✅ Estimated completion time
            <br>
            ✅ Service cost
        `;

    }


    // ==================================================
    // TYRE / TIRE
    // ==================================================

    if (
        q.includes("tyre") ||
        q.includes("tire")
    ) {

        return `
            <strong>🛞 Tyre Service</strong>
            <br><br>

            Tyre replacement cost depends on
            the vehicle and tyre brand.
            <br><br>

            <strong>Estimated Cost:</strong>
            ₹3,000 - ₹12,000+ per tyre
            <br>

            <strong>Wheel Alignment:</strong>
            ₹800 - ₹1,500
            <br>

            <strong>Wheel Balancing:</strong>
            ₹600 - ₹1,200
            <br><br>

            🔧 Exact pricing depends on tyre size
            and brand.
        `;

    }


    // ==================================================
    // SERVICE / MAINTENANCE
    // ==================================================

    if (
        q.includes("service") ||
        q.includes("maintenance")
    ) {

        return `
            <strong>🔧 Vehicle Service</strong>
            <br><br>

            A regular vehicle service can include:
            <br>
            ✅ Engine oil check/change
            <br>
            ✅ Brake inspection
            <br>
            ✅ Battery inspection
            <br>
            ✅ Tyre inspection
            <br>
            ✅ Fluid checks
            <br>
            ✅ General vehicle inspection
            <br><br>

            Typical service time:
            <strong>1 - 2 Hours</strong>.
        `;

    }


    // ==================================================
    // DEFAULT RESPONSE
    // ==================================================

    return `
        <strong>🤖 AI Vehicle Assistant</strong>
        <br><br>

        I can help you with vehicle service information.
        <br><br>

        Try asking:
        <br>
        🚗 "How much does brake pad replacement cost?"
        <br>
        🛢️ "How much does engine oil cost?"
        <br>
        🔋 "What is the battery warranty?"
        <br>
        ⏱️ "How long will my service take?"
        <br>
        ❄️ "How much does AC repair cost?"
        <br>
        🚘 "What is my vehicle service status?"
    `;

}

function getVehicleProblemPrediction(q) {
    const predictions = [];
    const hasAny = function (terms) {
        return terms.some(function (term) {
            return q.includes(term);
        });
    };

    if (hasAny(["engine noise", "engine knocking", "knocking sound", "knocking noise", "rattling", "ticking engine", "ticking noise", "tapping engine", "tapping noise", "strange engine sound"])) {
        predictions.push(`
            <strong>Possible issue: unusual engine noise</strong><br>
            Knocking or rattling can be related to low or incorrect engine oil, loose components, a belt or exhaust part, or internal engine wear.<br>
            <strong>Recommended service:</strong> Arrange an engine and oil-level inspection. If the noise is loud, the oil-pressure warning is on, or the vehicle is losing power, stop driving safely and arrange assistance.
        `);
    }

    if (hasAny(["low mileage", "poor mileage", "mileage is low", "fuel economy", "fuel efficiency", "high fuel consumption", "too much fuel", "using more fuel"])) {
        predictions.push(`
            <strong>Possible issue: reduced fuel efficiency</strong><br>
            Common contributors include low tyre pressure, a clogged air filter, worn spark plugs, poor wheel alignment, or a fuel/engine-management issue.<br>
            <strong>Recommended service:</strong> Check tyre pressure and book an inspection of the air filter, ignition system, alignment, and diagnostic codes.
        `);
    }

    if (hasAny(["overheat", "overheating", "temperature is high", "engine hot"])) {
        predictions.push(`
            <strong>Possible issue: engine overheating</strong><br>
            Possible causes include low coolant or a leak, a faulty thermostat or radiator fan, a water-pump issue, or a blocked radiator.<br>
            <strong>Recommended service:</strong> Stop somewhere safe and switch off the engine. Never open the radiator cap while hot. Arrange a cooling-system inspection; do not continue driving if the warning remains, steam appears, or coolant is leaking.
        `);
    }

    if (!predictions.length) {
        return "";
    }

    return `
        <strong>🔎 Possible problem prediction</strong>
        <p class="mb-2">Based on the symptoms you entered, these are possibilities, not a confirmed diagnosis:</p>
        ${predictions.map(function (prediction) {
            return `<p class="mb-2">${prediction}</p>`;
        }).join("")}
        <small>A mechanic must inspect the vehicle to confirm the cause.</small>
    `;
}


// ======================================================
// LIVE SEARCH
// ======================================================

function searchVehicle() {

    const searchElement = document.getElementById("search");


    if (!searchElement) {

        console.log("Search field not found.");

        return;

    }


    const input = searchElement.value.trim().toLowerCase();


    if (input === "") {

        alert("Please enter a vehicle or service name.");

        return;

    }


    alert("Searching for: " + input);

}


// ======================================================
// PROGRESS BAR
// ======================================================

function animateProgress() {

    const progress = document.getElementById("progressBar");


    if (!progress) {

        return;

    }


    let width = 0;


    const interval = setInterval(function () {


        if (width >= 65) {

            clearInterval(interval);

            return;

        }


        width++;


        progress.style.width = width + "%";

        progress.textContent = width + "%";


    }, 40);

}


// ======================================================
// NOTIFICATION
// ======================================================

function notify(text) {

    alert(text);

}


// ======================================================
// LOGOUT
// ======================================================

function logout() {
    serviceApi("logout", { method: "POST", body: "{}" })
        .then(function () {
            window.location.href = window.location.pathname.includes("/customer/")
                ? "../login.html"
                : "login.html";
        })
        .catch(function (error) {
            alert(error.message);
        });

}


// ======================================================
// DARK MODE
// ======================================================

function darkMode() {

    document.body.classList.toggle("bg-dark");

    document.body.classList.toggle("text-white");

}


// ======================================================
// SERVICE COMPLETED
// ======================================================

function serviceCompleted() {

    alert(
        "Congratulations!\nYour Vehicle Service is Completed."
    );

}


// ======================================================
// DOWNLOAD INVOICE
// ======================================================

function downloadInvoice() {

    alert("Invoice Download Started.");

}


// ======================================================
// CALL MECHANIC
// ======================================================

function callMechanic() {

    alert("Calling Mechanic...");

}


// ======================================================
// AI SUGGESTION BUTTONS
// ======================================================

function suggestion(text) {

    const input =
        document.getElementById("userMessage");


    if (!input) {

        return;

    }


    input.value = text;

    input.focus();

}


// ======================================================
// RATING
// ======================================================

function submitRating() {

    alert("Thank you for your Feedback!");

}