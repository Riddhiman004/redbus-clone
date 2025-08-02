// Sample bus data for demonstration
const buses = [
    { id: 1, name: "Express Line", source: "kolkata", destination: "puri", departure: "10:00 AM", price: 500 },
    { id: 2, name: "Super Bus", source: "kolkata", destination: "puri", departure: "02:00 PM", price: 450 },
    { id: 3, name: "Night Rider", source: "kolkata", destination: "puri", departure: "09:00 PM", price: 550 }
];

// Utility to get query parameters from URL
function getQueryParams() {
    const params = {};
    window.location.search.substring(1).split("&").forEach(pair => {
        const [key, value] = pair.split("=");
        params[key] = decodeURIComponent(value || "");
    });
    return params;
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem("loggedInUser") !== null;
}

// Get logged in user info
function getLoggedInUser() {
    const user = localStorage.getItem("loggedInUser");
    return user ? JSON.parse(user) : null;
}

// Logout user
function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

function displaySearchResults() {
    const params = getQueryParams();
    const resultsContainer = document.getElementById("resultsContainer");
    if (!resultsContainer) return;

    // If no search parameters, show message
    if (!params.source || !params.destination) {
        resultsContainer.innerHTML = "<p>Please use the search form on the Book Now page to find buses.</p>";
        return;
    }

    // Filter buses with case-insensitive exact match for source and destination
    const filteredBuses = buses.filter(bus =>
        bus.source.toLowerCase() === params.source.toLowerCase() &&
        bus.destination.toLowerCase() === params.destination.toLowerCase()
    );

    // If no buses found, show message
    if (filteredBuses.length === 0) {
        resultsContainer.innerHTML = "<p>No buses found for the selected route.</p>";
        return;
    }

    resultsContainer.innerHTML = "";
    filteredBuses.forEach(bus => {
        const busDiv = document.createElement("div");
        busDiv.className = "bus-item";
        busDiv.innerHTML = `
            <h3>${bus.name}</h3>
            <p>From: ${bus.source} To: ${bus.destination}</p>
            <p>Departure: ${bus.departure}</p>
            <p>Price: ₹${bus.price}</p>
            <button onclick="bookBus(${bus.id})">Book Now</button>
        `;
        resultsContainer.appendChild(busDiv);
    });
}

function bookBus(busId) {
    const bus = buses.find(b => b.id === busId);
    if (!bus) return;
    // Use relative URL for redirection
    const params = new URLSearchParams();
    params.set("busId", bus.id);
    params.set("busName", bus.name);
    window.location.href = "seat-selection.html?" + params.toString();
}

function populateBookingForm() {
    const params = getQueryParams();
    const busNameInput = document.getElementById("busName");
    const seatNumbersInput = document.getElementById("seatNumbers");
    if (busNameInput && params.busName) {
        busNameInput.value = decodeURIComponent(params.busName);
    }
    if (seatNumbersInput && params.seatNumbers) {
        seatNumbersInput.value = params.seatNumbers;
    }
}

function handleBookingForm() {
    const form = document.getElementById("seatSelectionForm");
    if (!form) return;

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const formData = new FormData(form);
        const bookingDetails = {
            busName: formData.get("busName"),
            seatNumbers: formData.get("seatNumbers")
        };

        // Save booking to localStorage
        const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
        bookings.push(bookingDetails);
        localStorage.setItem("bookings", JSON.stringify(bookings));

        // Redirect to payment page with booking details
        const url = new URL("payment.html", window.location.href);
        url.searchParams.set("busName", bookingDetails.busName);
        url.searchParams.set("seatNumbers", bookingDetails.seatNumbers);
        window.location.href = url.toString();
    });
}

function handlePaymentForm() {
    const form = document.getElementById("paymentForm");
    if (!form) return;

    const paymentMethodSelect = document.getElementById("paymentMethod");
    const cardDetailsDiv = document.getElementById("cardDetails");
    const upiDetailsDiv = document.getElementById("upiDetails");

    // Show/hide payment details based on selected method
    paymentMethodSelect.addEventListener("change", () => {
        const method = paymentMethodSelect.value;
        cardDetailsDiv.style.display = method === "card" ? "block" : "none";
        upiDetailsDiv.style.display = method === "upi" ? "block" : "none";
    });

    // Trigger change event on page load to show/hide correct payment details
    paymentMethodSelect.dispatchEvent(new Event('change'));

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        const formData = new FormData(form);
        const paymentMethod = formData.get("paymentMethod");

        if (!paymentMethod) {
            alert("Please select a payment method.");
            return;
        }

        if (paymentMethod === "card") {
            const cardName = formData.get("cardName");
            const cardNumber = formData.get("cardNumber");
            const expiryDate = formData.get("expiryDate");
            const cvv = formData.get("cvv");

            if (!cardName || !cardNumber || !expiryDate || !cvv) {
                alert("Please fill in all card payment details.");
                return;
            }
        } else if (paymentMethod === "upi") {
            const upiId = formData.get("upiId");
            if (!upiId) {
                alert("Please enter your UPI ID.");
                return;
            }
        } else if (paymentMethod === "cod") {
            // No additional details needed for COD
        }

        // Simulate payment processing delay
        alert("Payment successful! Redirecting to confirmation page...");

        // Redirect to confirmation page with booking details
        const params = getQueryParams();
        const url = new URL("confirmation.html", window.location.href);
        url.searchParams.set("busName", params.busName || "");
        url.searchParams.set("seatNumbers", params.seatNumbers || "");
        url.searchParams.set("passengerName", paymentMethod === "card" ? formData.get("cardName") : paymentMethod === "upi" ? formData.get("upiId") : "Cash on Delivery");
        window.location.href = url.toString();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Update auth links in header
    const authLinksSpan = document.getElementById("authLinks");
    if (authLinksSpan) {
        if (isLoggedIn()) {
            const user = getLoggedInUser();
            authLinksSpan.innerHTML = `
                Welcome, ${user.username} | <a href="#" onclick="logout()">Logout</a>
            `;
        } else {
            authLinksSpan.innerHTML = `<a href="login.html">Login</a>`;
        }
    }

    if (window.location.pathname.endsWith("search.html")) {
        displaySearchResults();
    } else if (window.location.pathname.endsWith("seat-selection.html")) {
        populateBookingForm();
        generateSeatLayout();
        handleBookingForm();
    } else if (window.location.pathname.endsWith("payment.html")) {
        displayBookingSummary();
        handlePaymentForm();
    } else if (window.location.pathname.endsWith("confirmation.html")) {
        displayConfirmation();
    }
});

// Display booking summary on payment page
function displayBookingSummary() {
    const params = getQueryParams();
    const summaryDiv = document.getElementById("bookingSummary");
    if (!summaryDiv) return;

    summaryDiv.innerHTML = `
        <p><strong>Bus Name:</strong> ${params.busName || ""}</p>
        <p><strong>Seat Numbers:</strong> ${params.seatNumbers || ""}</p>
    `;
}

function displayConfirmation() {
    const params = getQueryParams();
    const messageEl = document.getElementById("confirmationMessage");
    if (!messageEl) return;

    // Decode busName to handle encoded characters
    const busNameDecoded = decodeURIComponent(params.busName || "");

    // Display multiple seat numbers if provided
    const seatNumbers = params.seatNumbers || params.seatNumber || "";
    const seatText = seatNumbers.includes(",") ? `seat numbers <strong>${seatNumbers}</strong>` : `seat number <strong>${seatNumbers}</strong>`;

    messageEl.innerHTML = `
        <p>Thank you, <strong>${params.passengerName}</strong>, for booking ${seatText} on <strong>${busNameDecoded}</strong>.</p>
        <p>Your booking is confirmed. Please arrive at the boarding point 15 minutes before departure.</p>
        <p>We wish you a safe and comfortable journey!</p>
    `;
}

document.addEventListener("DOMContentLoaded", () => {
    // Update auth links in header
    const authLinksSpan = document.getElementById("authLinks");
    if (authLinksSpan) {
        if (isLoggedIn()) {
            const user = getLoggedInUser();
            authLinksSpan.innerHTML = `
                Welcome, ${user.username} | <a href="#" onclick="logout()">Logout</a>
            `;
        } else {
            authLinksSpan.innerHTML = `<a href="login.html">Login</a>`;
        }
    }

    if (window.location.pathname.endsWith("search.html")) {
        displaySearchResults();
    } else if (window.location.pathname.endsWith("seat-selection.html")) {
        populateBookingForm();
        generateSeatLayout();
        handleBookingForm();
    } else if (window.location.pathname.endsWith("confirmation.html")) {
        displayConfirmation();
    }
});

// Generate seat layout for bus seat selection
function generateSeatLayout() {
    const seatGrid = document.getElementById("seatGrid");
    if (!seatGrid) return;

    // Example: 40 seats, numbered 1 to 40
    const totalSeats = 40;

    // Example booked seats (could be fetched from storage or API)
    const bookedSeats = [3, 5, 8, 15];

    seatGrid.innerHTML = "";

    for (let i = 1; i <= totalSeats; i++) {
        const seat = document.createElement("div");
        seat.classList.add("seat");
        seat.textContent = i;

        if (bookedSeats.includes(i)) {
            seat.classList.add("booked");
        } else {
            seat.classList.add("available");
            seat.addEventListener("click", () => {
                seat.classList.toggle("selected");
                updateSelectedSeats();
            });
        }

        seatGrid.appendChild(seat);
    }
}

// Update seatNumbers input based on selected seats
function updateSelectedSeats() {
    const selectedSeats = Array.from(document.querySelectorAll(".seat.selected")).map(seat => seat.textContent);
    const seatNumbersInput = document.getElementById("seatNumbers");
    if (seatNumbersInput) {
        seatNumbersInput.value = selectedSeats.join(",");
    }
}
