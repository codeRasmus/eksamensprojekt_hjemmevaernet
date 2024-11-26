export function fontSizer(scalingFactor) {
  const root = document.documentElement;
  const vars = [
    "--header1",
    "--header2",
    "--header3",
    "--header4",
    "--header5",
    "--paragraph",
  ];

  vars.forEach((variable) => {
    let size = parseFloat(
      getComputedStyle(root).getPropertyValue(variable).replace("rem", "")
    );
    root.style.setProperty(variable, `${size * scalingFactor}rem`);
  });
}
