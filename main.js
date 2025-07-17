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

// ... (όλα τα υπόλοιπα DOM elements όπως πριν)

// Αυτόματη μετατροπή σε κεφαλαία κατά την πληκτρολόγηση
lessonFilterInput.addEventListener('input', function() {
  this.value = this.value.toUpperCase();
});

studentClassInput.addEventListener('input', function() {
  this.value = this.value.toUpperCase();
});

// ... (όλες οι υπόλοιπες συναρτήσεις όπως πριν μέχρι την viewLessonsBtn.addEventListener)

viewLessonsBtn.addEventListener("click", async () => {
  const studentClass = studentClassInput.value.trim().toUpperCase();
  const lessonFilter = lessonFilterInput.value.trim().toUpperCase();
  lessonsContainer.innerHTML = "";
  guestMessage.textContent = "";

  // Αυτόματη ενημέρωση των πεδίων
  studentClassInput.value = studentClass;
  lessonFilterInput.value = lessonFilter;

  if (!studentClass || !lessonFilter) {
    guestMessage.textContent = "Συμπληρώστε Μάθημα και Τμήμα";
    guestMessage.className = "error-message";
    return;
  }

  try {
    let q;
    if (auth.currentUser && auth.currentUser.email === 'pa.domvros@gmail.com') {
      // Ο διευθυντής βλέπει όλα
      q = query(
        collection(db, "lessons"),
        where("class", "==", studentClass),
        where("lesson", "==", lessonFilter),
        orderBy("date", "desc")
      );
    } else if (auth.currentUser) {
      // Οι εκπαιδευτικοί βλέπουν μόνο τα δικά τους
      q = query(
        collection(db, "lessons"),
        where("class", "==", studentClass),
        where("lesson", "==", lessonFilter),
        where("teacherEmail", "==", auth.currentUser.email),
        orderBy("date", "desc")
      );
    } else {
      // Οι επισκέπτες βλέπουν μόνο δημόσια δεδομένα
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
          if (confirm("Διαγραφή;")) {
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
  }
});

// ... (οι υπόλοιπες συναρτήσεις παραμένουν αμετάβλητες)