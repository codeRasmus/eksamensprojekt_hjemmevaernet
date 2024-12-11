const loadingDiv = document.querySelector(".loader");

export function loadAni() {
  console.log("Load animation startet");
  loadingDiv.classList.add("active");
}

export function stopLoadAni() {
  console.log("Load animation stoppet");
  loadingDiv.classList.remove("active");
}
