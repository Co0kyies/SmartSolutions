let kant = document.querySelector("#opt-kant");
let holes = document.querySelector("#opt-holes");
let selected = kant;
function selectedHasChanged() {
  kant.style.color = "black";
  kant.style.backgroundColor = "white";
  holes.style.color = "black";
  holes.style.backgroundColor = "white";

  selected.style.color = "#a50202";
  selected.style.backgroundColor = "#bdbdbd";
}

kant.addEventListener("click", () => {
  selected = kant;
  selectedHasChanged();
});

holes.addEventListener("click", () => {
  selected = holes;
  selectedHasChanged();
});

selectedHasChanged();

export function currentlySelected() {
  if (selected == kant) {
    return "/kant";
  } else {
    return "/holes";
  }
}
