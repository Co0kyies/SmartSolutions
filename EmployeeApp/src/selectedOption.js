let kant = document.querySelector("#opt-kant");
let cut = document.querySelector("#opt-cut");
let selected = kant;
function selectedHasChanged() {
  kant.style.color = "black";
  kant.style.backgroundColor = "white";
  cut.style.color = "black";
  cut.style.backgroundColor = "white";

  selected.style.color = "#a50202";
  selected.style.backgroundColor = "#bdbdbd";
}

kant.addEventListener("click", () => {
  selected = kant;
  selectedHasChanged();
});

cut.addEventListener("click", () => {
  selected = cut;
  selectedHasChanged();
});

selectedHasChanged();

export function currentlySelected() {
  if ((selected = kant)) {
    return "kant";
  } else {
    return "cut";
  }
}
