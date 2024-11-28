const loadingDiv = document.querySelector(".loader");

export function loadAni() {
    loadingDiv.classList.add("active");
}

export function stopLoadAni() {
    loadingDiv.classList.remove("active");
}
