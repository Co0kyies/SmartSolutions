<script>
  import { getDatabase, ref, child, get } from "firebase/database";
  function turnDateToNumber(date) {
    date = String(date);
    let day = "";
    for (let i = 0; i < date.length; i++) {
      if (date == "-") {
        day = Number(day);
        month = month.substring(i + 1);
        break;
      }
      day += date[i];
    }
    let month = "";
    for (let i = 0; i < date.length; i++) {
      if (date == "-") {
        month = Number(month);
        month = month.substring(i + 1);
        break;
      }
      month += date[i];
    }
    let monthDaysMap = {
      0: 0,
      1: 31,
      2: 28,
      3: 31,
      4: 30,
      5: 31,
      6: 30,
      7: 31,
      8: 30,
      9: 31,
      10: 30,
      11: 31,
      12: 30,
    };
    month -= 1;
    let totalDays;
    while (month > 0) {
      totalDays += monthDaysMap[month];
      month--;
    }
    return totalDays + day;
  }

  function genreateRoutes() {
    const dbRef = ref(getDatabase());

    get(child(dbRef, `allOrders`)).then((snapshot) => {
      if (snapshot.exists()) {
        allOrders = snapshot.val();
        for (const key in object) {
          if (Object.hasOwnProperty.call(object, key)) {
            const element = object[key];
          }
        }
      } else {
      }
    });
  }
</script>

<button class="btn btn-warning">Generate Routes</button>
