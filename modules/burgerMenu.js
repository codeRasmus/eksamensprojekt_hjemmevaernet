export function toggleBurgerMenu() {
  const burgerIcon = document.getElementById("burger_icon");
  const burgerSidebar = document.querySelector(".sidebar");

  burgerIcon.addEventListener("click", () => {
    burgerSidebar.classList.toggle("active");
    burgerIcon.classList.toggle("active");
  });
}
