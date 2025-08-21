const pills = document.querySelectorAll(".pill");
const panels = document.querySelectorAll(".panel");

pills.forEach(pill => {
    pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));

        pill.classList.add("active");
        document.getElementById(pill.dataset.target).classList.add("active");
    });
});