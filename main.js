import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVoOQsCrEvhRbFZP4rBgyf9dEd-AQq-us",
  authDomain: "schoolappv2-c1c84.firebaseapp.com",
  projectId: "schoolappv2-c1c84",
  storageBucket: "schoolappv2-c1c84.appspot.com",
  messagingSenderId: "70334432902",
  appId: "1:70334432902:web:d8ba08cfcf6d912fca3307"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const adminSection = document.getElementById("adminSection");
const lessonInput = document.getElementById("lessonInput");
const classInput = document.getElementById("classInput");
const dateInput = document.getElementById("dateInput");
const taughtMaterialInput = document.getElementById("taughtMaterialInput");
const attentionNotesInput = document.getElementById("attentionNotesInput");
const submitLessonBtn = document.getElementById("submitLessonBtn");
const adminMessage = document.getElementById("adminMessage");
const logoutBtn = document.getElementById("logoutBtn");

const studentClassInput = document.getElementById("studentClass");
const lessonFilterInput = document.getElementById("lessonFilter");
const viewLessonsBtn = document.getElementById("viewLessonsBtn");
const guestMessage = document.getElementById("guestMessage");
const lessonsContainer = document.getElementById("lessonsContainer");

const privateLastName = document.getElementById("privateLastName");
const privateClass = document.getElementById("privateClass");
const privateNotesInput = document.getElementById("privateNotesInput");
const submitPrivateNoteBtn = document.getElementById("submitPrivateNoteBtn");
const privateNoteMessage = document.getElementById("privateNoteMessage");
const privateNotesList = document.getElementById("privateNotesList");
const searchLastNameInput = document.getElementById("searchLastNameInput");
const searchClassInput = document.getElementById("searchClassInput");
const searchPrivateNotesBtn = document.getElementById("searchPrivateNotesBtn");

// Αυτόματη μετατροπή σε κεφαλαία για συγκεκριμένα πεδία
const setupUpperCaseInputs = () => {
  const uppercaseInputs = [
    classInput, studentClassInput, 
    lessonFilterInput, privateClass, 
    searchClassInput
  ];

  uppercaseInputs.forEach(input => {
    input.addEventListener('input', () => {
      input.value = input.value.toUpperCase();
    });
  });
};

// Initialize
setupUpperCaseInputs();

// Auth State Management
function toggleAdminView(loggedIn) {
  loginForm.style.display = loggedIn ? "none" : "block";
  adminSection.style.display = loggedIn ? "block" : "none";
}

onAuthStateChanged(auth, (user) => {
  toggleAdminView(!!user);
  if (user) {
    console.log("User logged in:", user.email);
    loadPrivateNotes();
  } else {
    console.log("User logged out");
  }
});

// Login Function
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginError.textContent = "Συμπληρώστε email και κωδικό";
    loginError.className = "error-message";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (error) {
    loginError.textContent = "Σφάλμα σύνδεσης: " + error.message;
    loginError.className = "error-message";
    console.error("Login error:", error);
  }
});

// Logout Function
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    emailInput.value = "";
    passwordInput.value = "";
    adminMessage.textContent = "";
  } catch (error) {
    console.error("Logout error:", error);
  }
});

// Submit Lesson Function
submitLessonBtn.addEventListener("click", async () => {
  const lesson = lessonInput.value.trim();
  const classVal = classInput.value.trim().toUpperCase();
  const date = dateInput.value;
  const taughtMaterial = taughtMaterialInput.value.trim();
  const attentionNotes = attentionNotesInput.value.trim();

  if (!lesson || !classVal || !date || !taughtMaterial) {
    adminMessage.textContent = "Συμπληρώστε όλα τα απαραίτητα πεδία";
    adminMessage.className = "error-message";
    return;
  }

  try {
    await addDoc(collection(db, "lessons"), {
      lesson: lesson.toUpperCase(),
      class: classVal,
      date,
      taughtMaterial,
      attentionNotes: attentionNotes || "—",
      timestamp: new Date().toISOString(),
      teacherEmail: auth.currentUser.email
    });

    adminMessage.textContent = "Η ύλη καταχωρίστηκε επιτυχώς!";
    adminMessage.className = "success-message";
    
    // Clear form
    lessonInput.value = "";
    classInput.value = "";
    dateInput.value = "";
    taughtMaterialInput.value = "";
    attentionNotesInput.value = "";
  } catch (error) {
    adminMessage.textContent = "Σφάλμα: " + error.message;
    adminMessage.className = "error-message";
    console.error("Submit lesson error:", error);
  }
});

// View Lessons Function
viewLessonsBtn.addEventListener("click", async () => {
  const studentClass = studentClassInput.value.trim().toUpperCase();
  const lessonFilter = lessonFilterInput.value.trim().toUpperCase();
  lessonsContainer.innerHTML = "";
  guestMessage.textContent = "";

  if (!studentClass || !lessonFilter) {
    guestMessage.textContent = "Συμπληρώστε Μάθημα και Τμήμα";
    guestMessage.className = "error-message";
    return;
  }

  try {
    let q;
    if (auth.currentUser?.email === 'pa.domvros@gmail.com') {
      // Director sees all
      q = query(
        collection(db, "lessons"),
        where("class", "==", studentClass),
        where("lesson", "==", lessonFilter),
        orderBy("date", "desc")
      );
    } else if (auth.currentUser) {
      // Teachers see only their own
      q = query(
        collection(db, "lessons"),
        where("class", "==", studentClass),
        where("lesson", "==", lessonFilter),
        where("teacherEmail", "==", auth.currentUser.email),
        orderBy("date", "desc")
      );
    } else {
      // Guests see all (filtered by class/lesson)
      q = query(
        collection(db, "lessons"),
        where("class", "==", studentClass),
        where("lesson", "==", lessonFilter),
        orderBy("date", "desc")
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      guestMessage.textContent = "Δεν βρέθηκε ύλη για τα κριτήρια αυτά";
      guestMessage.className = "info-message";
      return;
    }
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.className = "lesson-card";
      card.innerHTML = `
        <h4>${data.lesson} - ${data.class} (${data.date})</h4>
        <p><strong>Ύλη:</strong> ${data.taughtMaterial}</p>
        <p><strong>Προσοχή:</strong> ${data.attentionNotes || "—"}</p>
      `;
      
      if (auth.currentUser && (auth.currentUser.email === 'pa.domvros@gmail.com' || 
          auth.currentUser.email === data.teacherEmail)) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Διαγραφή";
        delBtn.className = "delete-btn";
        delBtn.onclick = async () => {
          if (confirm("Διαγραφή καταχώρησης;")) {
            await deleteDoc(doc(db, "lessons", docSnap.id));
            card.remove();
            guestMessage.textContent = "Η καταχώρηση διαγράφηκε!";
            guestMessage.className = "success-message";
          }
        };
        card.appendChild(delBtn);
      }
      lessonsContainer.appendChild(card);
    });
  } catch (error) {
    guestMessage.textContent = "Σφάλμα: " + error.message;
    guestMessage.className = "error-message";
    console.error("View lessons error:", error);
  }
});

// Private Notes Functions
submitPrivateNoteBtn.addEventListener("click", async () => {
  const lastName = privateLastName.value.trim();
  const classVal = privateClass.value.trim().toUpperCase();
  const note = privateNotesInput.value.trim();

  if (!lastName || !classVal || !note) {
    privateNoteMessage.textContent = "Συμπληρώστε όλα τα πεδία";
    privateNoteMessage.className = "error-message";
    return;
  }

  try {
    await addDoc(collection(db, "privateNotes"), {
      lastName,
      class: classVal,
      note,
      timestamp: new Date().toISOString(),
      teacherEmail: auth.currentUser.email
    });

    privateNoteMessage.textContent = "Η σημείωση αποθηκεύτηκε!";
    privateNoteMessage.className = "success-message";
    
    // Clear form
    privateLastName.value = "";
    privateClass.value = "";
    privateNotesInput.value = "";
    
    // Reload notes
    loadPrivateNotes();
  } catch (error) {
    privateNoteMessage.textContent = "Σφάλμα: " + error.message;
    privateNoteMessage.className = "error-message";
    console.error("Submit note error:", error);
  }
});

searchPrivateNotesBtn.addEventListener("click", () => {
  const lastName = searchLastNameInput.value.trim();
  const classVal = searchClassInput.value.trim().toUpperCase();
  loadPrivateNotes(lastName, classVal);
});

async function loadPrivateNotes(lastName = "", classVal = "") {
  privateNotesList.innerHTML = "";
  let q;

  if (auth.currentUser?.email === 'pa.domvros@gmail.com') {
    // Director sees all (with optional filters)
    if (lastName && classVal) {
      q = query(
        collection(db, "privateNotes"),
        where("lastName", "==", lastName),
        where("class", "==", classVal),
        orderBy("timestamp", "desc")
      );
    } else if (lastName) {
      q = query(
        collection(db, "privateNotes"),
        where("lastName", "==", lastName),
        orderBy("timestamp", "desc")
      );
    } else if (classVal) {
      q = query(
        collection(db, "privateNotes"),
        where("class", "==", classVal),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(
        collection(db, "privateNotes"),
        orderBy("timestamp", "desc")
      );
    }
  } else if (auth.currentUser) {
    // Teachers see only their own (with optional filters)
    if (lastName && classVal) {
      q = query(
        collection(db, "privateNotes"),
        where("teacherEmail", "==", auth.currentUser.email),
        where("lastName", "==", lastName),
        where("class", "==", classVal),
        orderBy("timestamp", "desc")
      );
    } else if (lastName) {
      q = query(
        collection(db, "privateNotes"),
        where("teacherEmail", "==", auth.currentUser.email),
        where("lastName", "==", lastName),
        orderBy("timestamp", "desc")
      );
    } else if (classVal) {
      q = query(
        collection(db, "privateNotes"),
        where("teacherEmail", "==", auth.currentUser.email),
        where("class", "==", classVal),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(
        collection(db, "privateNotes"),
        where("teacherEmail", "==", auth.currentUser.email),
        orderBy("timestamp", "desc")
      );
    }
  } else {
    privateNotesList.innerHTML = "<p>Απαιτείται σύνδεση για προβολή σημειώσεων</p>";
    return;
  }

  try {
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      privateNotesList.innerHTML = "<p>Δεν βρέθηκαν σημειώσεις</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const div = document.createElement("div");
      div.className = "lesson-card";
      div.innerHTML = `
        <p><strong>${data.lastName} (${data.class}):</strong> ${data.note}</p>
        <small>${new Date(data.timestamp).toLocaleString()}</small>
      `;

      if (auth.currentUser && (auth.currentUser.email === 'pa.domvros@gmail.com' || 
          auth.currentUser.email === data.teacherEmail)) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Διαγραφή";
        delBtn.className = "delete-btn";
        delBtn.onclick = async () => {
          if (confirm("Διαγραφή σημείωσης;")) {
            await deleteDoc(doc(db, "privateNotes", docSnap.id));
            loadPrivateNotes(lastName, classVal);
          }
        };
        div.appendChild(delBtn);
      }
      privateNotesList.appendChild(div);
    });
  } catch (error) {
    privateNotesList.innerHTML = `<p class="error-message">Σφάλμα: ${error.message}</p>`;
    console.error("Load notes error:", error);
  }
}