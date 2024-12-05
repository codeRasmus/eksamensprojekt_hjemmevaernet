export function toggleBurgerMenu() {
  const burgerIcon = document.getElementById("burger_icon");
  const burgerNav = document.getElementById("burger_nav");

  burgerIcon.addEventListener("click", () => {
    burgerNav.classList.toggle("active");
    burgerIcon.classList.toggle("active");
  });
}
