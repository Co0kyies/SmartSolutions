import { app } from "./firebase";
import { getDatabase, set, ref } from "firebase/database";
import { currentlySelected } from "./selectedOption";

function onScanSuccess(decodedText, decodedResult) {
  // handle the scanned code as you like, for example:
  console.log(`Code matched = ${decodedText}`, decodedResult);
  let path;
  if (currentlySelected() == "kant") {
    path = "/kant";
  } else {
    path = "/cut";
  }
  const db = getDatabase(app);
  set(ref(db, path), decodedText);
}

function onScanFailure(error) {
  // handle scan failure, usually better to ignore and keep scanning.
  // for example:
  console.warn(`Code scan error = ${error}`);
}

let html5QrcodeScanner = new Html5QrcodeScanner(
  "reader",
  { fps: 10, qrbox: { width: 250, height: 250 } },
  /* verbose= */ false
);

html5QrcodeScanner.render(onScanSuccess, onScanFailure);
