<script>
  import { app } from "./firebase";
  import { getDatabase, ref, child, get } from "firebase/database";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  function schedule() {
    let courses = [];
    const dbRef = ref(getDatabase());
    get(child(dbRef, `schedule`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          console.log(snapshot.val());
          let snapshotVal = snapshot.val();
          for (let index = 0; index < snapshotVal.length; index++) {
            let course = snapshotVal[index];
            let ordersArray = course.orders;
            for (let index = 0; index < ordersArray.length; index++) {
              let orderId = ordersArray[index];
              function parentFunc() {
                let scopedCourse = course;
                let scopedOrdersArray = ordersArray;
                let scopedOrderId = orderId;
                let newCourseEntry = {};
                newCourseEntry.destination = scopedCourse.destination;
                newCourseEntry[scopedOrderId] = {};
                function childFunc(snapshot) {
                  if (snapshot.exists()) {
                    let orderItems = snapshot.val();
                    for (let index = 0; index < orderItems.length; index++) {
                      let itemId = orderItems[index];
                      newCourseEntry[scopedOrderId][itemId] = {};
                      get(child(dbRef, `items/${itemId}/model`)).then(
                        (snapshot) => {
                          if (snapshot.exists()) {
                            newCourseEntry[scopedOrderId][itemId].model =
                              snapshot.val();
                          }
                        }
                      );
                      get(child(dbRef, `items/${itemId}/materials`)).then(
                        (snapshot) => {
                          if (snapshot.exists()) {
                            newCourseEntry[scopedOrderId][itemId].materials =
                              snapshot.val();
                          }
                        }
                      );
                      setTimeout(() => {
                        courses.push(newCourseEntry);
                      }, 10000);
                    }
                  } else {
                  }
                }
                return childFunc;
              }
              // let childFunc = parentFunc()
              get(child(dbRef, `allOrders/${orderId}/items`)).then(
                parentFunc()
              );
            }
          }
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
    setTimeout(() => {
      eel.dump_orders(courses);
    }, 15000);
  }
  let btn;
</script>

<div>
  <h1>Smart Solutions</h1>
  <button
    bind:this={btn}
    on:click={() => {
      schedule();
      btn.className = "d-none";
      dispatch("buttonPressed");
    }}
    class="btn btn-success">Направи График</button
  >
</div>

<style>
  div {
    background-color: rgb(39, 39, 39);
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 6rem;
  }
  h1 {
    margin-left: 2rem;
    color: honeydew;
  }
  button {
    margin-right: 2rem;
  }
</style>
